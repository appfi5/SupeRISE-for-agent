import { useEffect, useRef, useState, useTransition } from "react";
import type {
  AuditLogDto,
  EthereumAddressDto,
  EthereumBalanceEthDto,
  EthereumBalanceUsdcDto,
  EthereumBalanceUsdtDto,
  EthereumSignMessageResponse,
  EthereumTransferEthResponse,
  EthereumTransferUsdcResponse,
  EthereumTransferUsdtResponse,
  NervosAddressDto,
  NervosBalanceCkbDto,
  NervosSignMessageResponse,
  NervosTransferCkbResponse,
  OwnerAssetLimitEntryDto,
  OwnerCredentialStatusDto,
  OwnerLoginResponse,
  OwnerWalletExportResponse,
  WalletCurrentDto,
} from "@superise/app-contracts";
import { request, ApiError } from "./api/client";
import { callWalletTool } from "./api/wallet-tools";
import {
  clearOwnerAccessToken,
  hasOwnerAccessToken,
  setOwnerAccessToken,
} from "./api/owner-auth-token";
import { DashboardScreen } from "./components/DashboardScreen";
import { LoginScreen } from "./components/LoginScreen";
import {
  emptyAppState,
  type AppState,
  type AssetLimitFormState,
  type CkbTransferFormState,
  type EthTransferFormState,
  type MessageSigningFormState,
  type RotateCredentialFormState,
  type UsdcTransferFormState,
  type UsdtTransferFormState,
} from "./types/app-state";
import { createLimitKey } from "./components/AssetLimitPanel";

const EMPTY_MESSAGE_SIGNING_FORM: MessageSigningFormState = {
  message: "",
  encoding: "utf8",
};

const EMPTY_CKB_TRANSFER_FORM: CkbTransferFormState = {
  to: "",
  amount: "",
};

const EMPTY_ETH_TRANSFER_FORM: EthTransferFormState = {
  to: "",
  amount: "",
};

const EMPTY_USDT_TRANSFER_FORM: UsdtTransferFormState = {
  to: "",
  amount: "",
};

const EMPTY_USDC_TRANSFER_FORM: UsdcTransferFormState = {
  to: "",
  amount: "",
};

export function App() {
  const refreshTokenRef = useRef(0);
  const [appState, setAppState] = useState<AppState>(emptyAppState);
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [message, setMessage] = useState("");
  const [exportedKey, setExportedKey] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rotateForm, setRotateForm] = useState<RotateCredentialFormState>({
    currentPassword: "",
    newPassword: "",
  });
  const [nervosSignForm, setNervosSignForm] =
    useState<MessageSigningFormState>(EMPTY_MESSAGE_SIGNING_FORM);
  const [ethereumSignForm, setEthereumSignForm] =
    useState<MessageSigningFormState>(EMPTY_MESSAGE_SIGNING_FORM);
  const [ckbTransfer, setCkbTransfer] =
    useState<CkbTransferFormState>(EMPTY_CKB_TRANSFER_FORM);
  const [ethTransfer, setEthTransfer] =
    useState<EthTransferFormState>(EMPTY_ETH_TRANSFER_FORM);
  const [usdtTransfer, setUsdtTransfer] =
    useState<UsdtTransferFormState>(EMPTY_USDT_TRANSFER_FORM);
  const [usdcTransfer, setUsdcTransfer] =
    useState<UsdcTransferFormState>(EMPTY_USDC_TRANSFER_FORM);
  const [assetLimitDrafts, setAssetLimitDrafts] = useState<
    Record<string, AssetLimitFormState>
  >({});
  const [importKey, setImportKey] = useState("");
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [nervosSignResult, setNervosSignResult] = useState("");
  const [ethereumSignResult, setEthereumSignResult] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void boot();
  }, []);

  async function boot() {
    try {
      await refreshAuthenticatedState();
    } finally {
      setBooting(false);
    }
  }

  async function refreshAuthenticatedState() {
    if (!hasOwnerAccessToken()) {
      resetToLogin();
      return;
    }

    const refreshToken = ++refreshTokenRef.current;

    try {
      const [credential, current, assetLimits, audits] = await Promise.all([
        request<OwnerCredentialStatusDto>("/api/owner/credential/status"),
        callWalletTool<WalletCurrentDto>("wallet.current"),
        request<OwnerAssetLimitEntryDto[]>("/api/owner/asset-limits"),
        request<AuditLogDto[]>("/api/owner/audit-logs?limit=20"),
      ]);

      if (refreshToken !== refreshTokenRef.current) {
        return;
      }

      setAuthenticated(true);
      setAppState((currentState) => ({
        ...currentState,
        credential,
        current,
        assetLimits,
        audits,
      }));
      setAssetLimitDrafts(createAssetLimitDraftMap(assetLimits));

      void refreshChainState(refreshToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        resetToLogin("登录状态已过期，请重新登录。");
        return;
      }

      setMessage(error instanceof Error ? error.message : "Failed to load Owner Mode");
    }
  }

  async function refreshChainState(refreshToken: number) {
    void loadChainSlice(
      refreshToken,
      () => callWalletTool<NervosAddressDto>("nervos.address"),
      (value) =>
        setAppState((currentState) => ({
          ...currentState,
          nervos: {
            ...currentState.nervos,
            address: value,
          },
        })),
      "Nervos 地址",
    );
    void loadChainSlice(
      refreshToken,
      () => callWalletTool<NervosBalanceCkbDto>("nervos.balance.ckb"),
      (value) =>
        setAppState((currentState) => ({
          ...currentState,
          nervos: {
            ...currentState.nervos,
            ckbBalance: value,
          },
        })),
      "Nervos 余额",
    );
    void loadChainSlice(
      refreshToken,
      () => callWalletTool<EthereumAddressDto>("ethereum.address"),
      (value) =>
        setAppState((currentState) => ({
          ...currentState,
          ethereum: {
            ...currentState.ethereum,
            address: value,
          },
        })),
      "Ethereum 地址",
    );
    void loadChainSlice(
      refreshToken,
      () => callWalletTool<EthereumBalanceEthDto>("ethereum.balance.eth"),
      (value) =>
        setAppState((currentState) => ({
          ...currentState,
          ethereum: {
            ...currentState.ethereum,
            ethBalance: value,
          },
        })),
      "ETH 余额",
    );
    void loadChainSlice(
      refreshToken,
      () => callWalletTool<EthereumBalanceUsdtDto>("ethereum.balance.usdt"),
      (value) =>
        setAppState((currentState) => ({
          ...currentState,
          ethereum: {
            ...currentState.ethereum,
            usdtBalance: value,
          },
        })),
      "USDT 余额",
    );
    void loadChainSlice(
      refreshToken,
      () => callWalletTool<EthereumBalanceUsdcDto>("ethereum.balance.usdc"),
      (value) =>
        setAppState((currentState) => ({
          ...currentState,
          ethereum: {
            ...currentState.ethereum,
            usdcBalance: value,
          },
        })),
      "USDC 余额",
    );
  }

  async function loadChainSlice<T>(
    refreshToken: number,
    task: () => Promise<T>,
    onSuccess: (value: T) => void,
    label: string,
  ) {
    try {
      const value = await task();
      if (refreshToken !== refreshTokenRef.current) {
        return;
      }

      onSuccess(value);
    } catch (error) {
      if (refreshToken !== refreshTokenRef.current) {
        return;
      }

      if (error instanceof ApiError && error.status === 401) {
        resetToLogin("登录状态已过期，请重新登录。");
        return;
      }

      setMessage((current) =>
        current || `${label} 刷新失败：${error instanceof Error ? error.message : "请求失败"}`,
      );
    }
  }

  function runAction(task: () => Promise<void>) {
    startTransition(() => {
      void task().catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          resetToLogin(
            authenticated ? "登录状态已过期，请重新登录。" : error.message,
          );
          return;
        }

        setMessage(error instanceof Error ? error.message : "Operation failed");
      });
    });
  }

  function resetToLogin(nextMessage = "") {
    clearOwnerAccessToken();
    setAuthenticated(false);
    setAppState(emptyAppState);
    setAssetLimitDrafts({});
    setExportedKey("");
    setImportKey("");
    setImportConfirmed(false);
    setNervosSignResult("");
    setEthereumSignResult("");
    setMessage(nextMessage);
  }

  async function handleLogin() {
    const result = await request<OwnerLoginResponse>("/api/owner/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: loginPassword }),
    });
    setOwnerAccessToken(result.accessToken);
    setAuthenticated(true);
    setMessage(
      result.credentialStatus === "DEFAULT_PENDING_ROTATION"
        ? "已登录。当前仍是默认凭证，请尽快轮换。"
        : "已登录 Owner Mode。",
    );
    setLoginPassword("");
    await refreshAuthenticatedState();
  }

  async function handleLogout() {
    try {
      await request("/api/owner/auth/logout", {
        method: "POST",
      });
    } finally {
      resetToLogin("已退出 Owner Mode。");
    }
  }

  async function handleRotateCredential() {
    await request("/api/owner/auth/rotate-credential", {
      method: "POST",
      body: JSON.stringify(rotateForm),
    });
    resetToLogin("Owner 凭证已更新，请使用新密码重新登录。");
    setRotateForm({ currentPassword: "", newPassword: "" });
  }

  async function handleNervosSignMessage() {
    const result = await callWalletTool<NervosSignMessageResponse>(
      "nervos.sign_message",
      nervosSignForm,
    );
    setNervosSignResult(formatSignResult(result.signingAddress, result.signature));
    setMessage("Nervos 消息签名完成。");
    await refreshAuthenticatedState();
  }

  async function handleEthereumSignMessage() {
    const result = await callWalletTool<EthereumSignMessageResponse>(
      "ethereum.sign_message",
      ethereumSignForm,
    );
    setEthereumSignResult(formatSignResult(result.signingAddress, result.signature));
    setMessage("Ethereum 消息签名完成。");
    await refreshAuthenticatedState();
  }

  async function handleTransferCkb() {
    const result = await callWalletTool<NervosTransferCkbResponse>(
      "nervos.transfer.ckb",
      ckbTransfer,
    );
    setMessage(`CKB 转账已提交：${result.operationId}`);
    setCkbTransfer(EMPTY_CKB_TRANSFER_FORM);
    await refreshAuthenticatedState();
  }

  async function handleTransferUsdt() {
    const result = await callWalletTool<EthereumTransferUsdtResponse>(
      "ethereum.transfer.usdt",
      usdtTransfer,
    );
    setMessage(`USDT 转账已提交：${result.operationId}`);
    setUsdtTransfer(EMPTY_USDT_TRANSFER_FORM);
    await refreshAuthenticatedState();
  }

  async function handleTransferUsdc() {
    const result = await callWalletTool<EthereumTransferUsdcResponse>(
      "ethereum.transfer.usdc",
      usdcTransfer,
    );
    setMessage(`USDC 转账已提交：${result.operationId}`);
    setUsdcTransfer(EMPTY_USDC_TRANSFER_FORM);
    await refreshAuthenticatedState();
  }

  async function handleTransferEth() {
    const result = await callWalletTool<EthereumTransferEthResponse>(
      "ethereum.transfer.eth",
      ethTransfer,
    );
    setMessage(`ETH 转账已提交：${result.operationId}`);
    setEthTransfer(EMPTY_ETH_TRANSFER_FORM);
    await refreshAuthenticatedState();
  }

  async function handleSaveAssetLimit(key: string) {
    const limit = appState.assetLimits.find((entry) => createLimitKey(entry) === key);
    const draft = assetLimitDrafts[key];

    if (!limit || !draft) {
      setMessage("未找到对应的限额配置。");
      return;
    }

    await request<OwnerAssetLimitEntryDto>(
      `/api/owner/asset-limits/${limit.chain}/${limit.asset}`,
      {
        method: "PUT",
        body: JSON.stringify({
          dailyLimit: draft.dailyLimit.trim() ? draft.dailyLimit.trim() : null,
          weeklyLimit: draft.weeklyLimit.trim() ? draft.weeklyLimit.trim() : null,
          monthlyLimit: draft.monthlyLimit.trim() ? draft.monthlyLimit.trim() : null,
        }),
      },
    );
    setMessage(`${limit.asset} 限额已保存。`);
    await refreshAuthenticatedState();
  }

  async function handleImportWallet() {
    if (!importConfirmed) {
      setMessage("请先确认导入会替换当前唯一钱包。");
      return;
    }

    await request("/api/owner/wallet/import", {
      method: "POST",
      body: JSON.stringify({ privateKey: importKey, confirmed: true }),
    });
    setImportKey("");
    setImportConfirmed(false);
    setMessage("钱包已导入并替换当前钱包。");
    await refreshAuthenticatedState();
  }

  async function handleExportWallet() {
    const result = await request<OwnerWalletExportResponse>("/api/owner/wallet/export", {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    });
    setExportedKey(result.privateKey);
    setMessage("私钥已导出。请按高风险动作处理。");
    await refreshAuthenticatedState();
  }

  if (booting) {
    return <div className="screen-center">Loading Owner Mode...</div>;
  }

  if (!authenticated) {
    return (
      <LoginScreen
        isPending={isPending}
        loginPassword={loginPassword}
        message={message}
        onLoginPasswordChange={setLoginPassword}
        onSubmit={() => runAction(handleLogin)}
      />
    );
  }

  return (
    <DashboardScreen
      appState={appState}
      ckbTransfer={ckbTransfer}
      ethTransfer={ethTransfer}
      ethereumSignForm={ethereumSignForm}
      ethereumSignResult={ethereumSignResult}
      exportedKey={exportedKey}
      importConfirmed={importConfirmed}
      importKey={importKey}
      message={message}
      nervosSignForm={nervosSignForm}
      nervosSignResult={nervosSignResult}
      rotateForm={rotateForm}
      assetLimitDrafts={assetLimitDrafts}
      usdcTransfer={usdcTransfer}
      usdtTransfer={usdtTransfer}
      onCkbAmountChange={(value) =>
        setCkbTransfer((current) => ({ ...current, amount: value }))
      }
      onCkbSubmit={() => runAction(handleTransferCkb)}
      onCkbToChange={(value) =>
        setCkbTransfer((current) => ({ ...current, to: value }))
      }
      onEthAmountChange={(value) =>
        setEthTransfer((current) => ({ ...current, amount: value }))
      }
      onEthSubmit={() => runAction(handleTransferEth)}
      onEthToChange={(value) =>
        setEthTransfer((current) => ({ ...current, to: value }))
      }
      onEthereumSignEncodingChange={(value) =>
        setEthereumSignForm((current) => ({ ...current, encoding: value }))
      }
      onEthereumSignMessageChange={(value) =>
        setEthereumSignForm((current) => ({ ...current, message: value }))
      }
      onEthereumSignSubmit={() => runAction(handleEthereumSignMessage)}
      onExport={() => runAction(handleExportWallet)}
      onImport={() => runAction(handleImportWallet)}
      onImportConfirmedChange={setImportConfirmed}
      onImportKeyChange={setImportKey}
      onLogout={() => runAction(handleLogout)}
      onNervosSignEncodingChange={(value) =>
        setNervosSignForm((current) => ({ ...current, encoding: value }))
      }
      onNervosSignMessageChange={(value) =>
        setNervosSignForm((current) => ({ ...current, message: value }))
      }
      onNervosSignSubmit={() => runAction(handleNervosSignMessage)}
      onRotateCurrentPasswordChange={(value) =>
        setRotateForm((current) => ({ ...current, currentPassword: value }))
      }
      onRotateNewPasswordChange={(value) =>
        setRotateForm((current) => ({ ...current, newPassword: value }))
      }
      onRotateSubmit={() => runAction(handleRotateCredential)}
      onAssetLimitChange={(key, field, value) =>
        setAssetLimitDrafts((current) => ({
          ...current,
          [key]: {
            ...(current[key] ?? { dailyLimit: "", weeklyLimit: "", monthlyLimit: "" }),
            [field]: value,
          },
        }))
      }
      onAssetLimitSave={(key) => runAction(() => handleSaveAssetLimit(key))}
      onUsdcAmountChange={(value) =>
        setUsdcTransfer((current) => ({ ...current, amount: value }))
      }
      onUsdcSubmit={() => runAction(handleTransferUsdc)}
      onUsdcToChange={(value) =>
        setUsdcTransfer((current) => ({ ...current, to: value }))
      }
      onUsdtAmountChange={(value) =>
        setUsdtTransfer((current) => ({ ...current, amount: value }))
      }
      onUsdtSubmit={() => runAction(handleTransferUsdt)}
      onUsdtToChange={(value) =>
        setUsdtTransfer((current) => ({ ...current, to: value }))
      }
    />
  );
}

function formatSignResult(signingAddress: string, signature: string): string {
  return `${signingAddress}\n${signature}`;
}

function createAssetLimitDraftMap(
  limits: OwnerAssetLimitEntryDto[],
): Record<string, AssetLimitFormState> {
  return Object.fromEntries(
    limits.map((limit) => [
      createLimitKey(limit),
      {
        dailyLimit: limit.dailyLimit ?? "",
        weeklyLimit: limit.weeklyLimit ?? "",
        monthlyLimit: limit.monthlyLimit ?? "",
      },
    ]),
  );
}
