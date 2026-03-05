/**
 * Platform API Type Definitions
 * 
 * Maps to SupeRISE Market platform API responses.
 * See: docs/sustain/swagger.json
 */

// ===== Generic Response Wrappers =====

export type PlatformResponse<T> = {
  data: T;
  success: boolean;
  message: string;
  code: number;
  errorData: unknown[] | null;
};

export type PlatformPagedData<T> = {
  items: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
};

// ===== Authentication =====

export type PlatformTokenVo = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  scope: string;
};

export type PlatformUserInfoVo = {
  userId: string;
  userName: string;
  email: string;
  ckbAddress: string;
  avatar: string;
  isEnabled: boolean;
  balance: string;
};

// ===== Models =====

export type PlatformAiModel = {
  id: string;
  name: string;
  provider: string;
  version: string;
  scene: number;
  capability: string;
};

export type PlatformModelQuotation = {
  id: string;
  merchantId: string;
  modelId: string;
  price: number;
};

export type PlatformModelApiKeyVo = {
  id: string;
  name: string;
  apiKey: string;
  isRevoked: boolean;
  createdAt: string;
};

// ===== OpenAI Compatible API =====

export type OpenAIModelEntry = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type OpenAIModelsResponse = {
  object: "list";
  data: OpenAIModelEntry[];
};

// ===== Sustain Internal Types =====

export type ModelWithPricing = {
  platformId: string;
  shortName: string;
  displayName: string;
  provider: string;
  version: string;
  scene: number;
  capability: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  quotationCount: number;
};

export type BalanceStatus = {
  balance: number;
  userName: string;
  email: string;
  observedAt: string;
};

// ===== Orders (Top-up) =====

export enum CurrencyType {
  Unknown = 0,
  Btc = 1,
  Ckb = 2,
  Usdi = 3,
  Eth = 4,
  Usdc = 5,
  Usdt = 6,
}

export type CreateOrderRequest = {
  fromAddress: string;
  currencyType: CurrencyType;
  amount: number;
};

export type CreateOrderVo = {
  id: string;
  toAddress: string;
  currencyType: number;
  exchangeAmount: string;
};

export type SubmitTxHashRequest = {
  orderId: string;
  txHash: string;
};

export type TopUpResult = {
  success: boolean;
  txHash?: string;
  amountCKB: number;
  newBalance?: number;
  error?: string;
  orderId?: string;
  toAddress?: string;
  exchangeAmount?: string;
};
