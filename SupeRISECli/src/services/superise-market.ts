/**
 * SupeRISE Market Platform Client
 * 
 * Provides interface to superise-market platform API.
 * Base URL: https://superise-market.superise.net
 */

import type {
  PlatformResponse,
  PlatformPagedData,
  PlatformAiModel,
  PlatformModelQuotation,
  BalanceStatus,
  ModelWithPricing,
  TopUpResult,
  CreateOrderRequest,
  CreateOrderVo,
  SubmitTxHashRequest,
} from "@/services/platform-types";
import { getAuthService } from "@/services/platform-auth";
import { getConfigValue } from "@/core/sustain/config";
import { savePendingOrder } from "@/services/pending-orders";
import { CKB_DECIMALS } from "@/utils/constants";
import { parseFixedPoint } from "@/utils/validator";
import { executeCkbTransfer } from "@/services/ckb-transfer";

export interface SupeRISEMarketClient {
  fetchBalance(): Promise<BalanceStatus>;
  fetchModels(): Promise<ModelWithPricing[]>;
  topUp(amountCKB: number, dryRun: boolean): Promise<TopUpResult>;
}

class MarketClient implements SupeRISEMarketClient {
  private baseUrl: string;
  private modelsCache: {
    data: ModelWithPricing[] | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };
  private modelsCacheTTL = 30 * 60 * 1000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchBalance(): Promise<BalanceStatus> {
    const auth = getAuthService();
    const token = await auth.ensureToken();

    const response = await fetch(`${this.baseUrl}/api/v1/user/info`, {
      method: "GET",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }

    const data: PlatformResponse<any> = await response.json();
    if (!data.success) {
      throw new Error(`Failed to fetch balance: ${data.message}`);
    }

    const address = await auth.getAddress();
    return {
      balance: parseFloat(data.data.balance) || 0,
      userName: data.data.userName || address,
      email: data.data.email || "",
      observedAt: new Date().toISOString(),
    };
  }

  async fetchModels(): Promise<ModelWithPricing[]> {
    const now = Date.now();
    if (
      this.modelsCache.data &&
      now - this.modelsCache.timestamp < this.modelsCacheTTL
    ) {
      return this.modelsCache.data;
    }

    const allModels = await this.fetchAllModels();

    const modelsWithPricing = await Promise.all(
      allModels.map(async (model) => {
        const quotations = await this.fetchModelQuotations(model.id);
        const prices = quotations.map((q) => q.price);

        return {
          platformId: model.id,
          shortName: model.name.toLowerCase(),
          modelRef: `${model.provider}/${model.name.toLowerCase()}`,
          displayName: model.name,
          provider: model.provider,
          version: model.version,
          scene: model.scene,
          capability: model.capability,
          minPrice: prices.length > 0 ? Math.min(...prices) : 0,
          maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
          avgPrice:
            prices.length > 0
              ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
              : 0,
          quotationCount: quotations.length,
        };
      })
    );

    this.modelsCache = { data: modelsWithPricing, timestamp: now };
    return modelsWithPricing;
  }


  async topUp(amountCKB: number, dryRun: boolean): Promise<TopUpResult> {
    if (dryRun) {
      const balance = await this.fetchBalance();
      return {
        success: true,
        amountCKB,
        newBalance: balance.balance + amountCKB * 0.001427,
      };
    }

    const auth = getAuthService();
    const token = await auth.ensureToken();
    const fromAddress = await auth.getAddress();

    const createOrderRequest: CreateOrderRequest = {
      fromAddress,
      currencyType: 2,
      amount: amountCKB,
    };

    const createOrderResponse = await fetch(
      `${this.baseUrl}/api/v1/order/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(createOrderRequest),
      }
    );

    if (!createOrderResponse.ok) {
      return {
        success: false,
        amountCKB,
        error: `Failed to create order: ${createOrderResponse.statusText}`,
      };
    }

    const createOrderData: PlatformResponse<CreateOrderVo> =
      await createOrderResponse.json();

    if (!createOrderData.success) {
      return {
        success: false,
        amountCKB,
        error: createOrderData.message,
      };
    }

    const { id: orderId, toAddress, exchangeAmount } = createOrderData.data;

    let txHash: string;
    try {
      const transferResult = await executeCkbTransfer({
        toAddress,
        amountShannon: parseFixedPoint(String(amountCKB), CKB_DECIMALS),
      });
      if (!transferResult.txHash) {
        throw new Error("Transfer completed without a transaction hash.");
      }
      txHash = transferResult.txHash;
    } catch (error) {
      return {
        success: false,
        amountCKB,
        orderId,
        toAddress,
        error: `CKB transfer failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    const submitTxRequest: SubmitTxHashRequest = {
      orderId,
      txHash,
    };

    const submitTxResponse = await fetch(
      `${this.baseUrl}/api/v1/order/submit-tx-hash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(submitTxRequest),
      }
    );

    if (!submitTxResponse.ok) {
      savePendingOrder({ orderId, txHash, fromAddress, toAddress, amountCKB });
      return {
        success: false,
        amountCKB,
        txHash,
        orderId,
        toAddress,
        error: `Failed to submit tx hash: ${submitTxResponse.statusText} (saved for retry)`,
      };
    }

    const submitTxData: PlatformResponse<boolean> =
      await submitTxResponse.json();

    if (!submitTxData.success) {
      savePendingOrder({ orderId, txHash, fromAddress, toAddress, amountCKB });
      return {
        success: false,
        amountCKB,
        txHash,
        orderId,
        toAddress,
        error: `Failed to submit tx hash: ${submitTxData.message} (saved for retry)`,
      };
    }

    const newBalance = await this.fetchBalance();

    return {
      success: true,
      txHash,
      amountCKB,
      orderId,
      toAddress,
      exchangeAmount,
      newBalance: newBalance.balance,
    };
  }

  private async fetchAllModels(): Promise<PlatformAiModel[]> {
    const allModels: PlatformAiModel[] = [];
    let pageIndex = 1;
    const pageSize = 50;

    while (true) {
      const response = await fetch(
        `${this.baseUrl}/api/v1/ai-models?pageIndex=${pageIndex}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data: PlatformResponse<PlatformPagedData<PlatformAiModel>> =
        await response.json();
      if (!data.success) {
        throw new Error(`Failed to fetch models: ${data.message}`);
      }

      allModels.push(...data.data.items);

      if (allModels.length >= data.data.total) {
        break;
      }

      pageIndex++;
    }

    return allModels;
  }

  private async fetchModelQuotations(
    modelId: string
  ): Promise<PlatformModelQuotation[]> {
    const allQuotations: PlatformModelQuotation[] = [];
    let pageIndex = 1;
    const pageSize = 50;

    while (true) {
      const response = await fetch(
        `${this.baseUrl}/api/v1/ai-models/quotations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ modelId, pageIndex, pageSize }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch quotations: ${response.statusText}`);
      }

      const data: PlatformResponse<
        PlatformPagedData<PlatformModelQuotation>
      > = await response.json();
      if (!data.success) {
        throw new Error(`Failed to fetch quotations: ${data.message}`);
      }

      allQuotations.push(...data.data.items);

      if (allQuotations.length >= data.data.total) {
        break;
      }

      pageIndex++;
    }

    return allQuotations;
  }

}

let clientInstance: SupeRISEMarketClient | null = null;

export function getMarketClient(): SupeRISEMarketClient {
  if (clientInstance) {
    return clientInstance;
  }

  const baseUrl = getConfigValue("platformBaseUrl");
  clientInstance = new MarketClient(baseUrl);
  return clientInstance;
}

export function resetClient(): void {
  clientInstance = null;
}
