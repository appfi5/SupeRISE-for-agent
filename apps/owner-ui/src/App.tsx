import { useEffect, useRef, useState } from "react";
import { App as AntdApp } from "antd";
import type {
  AddressBookCreateResponse,
  AddressBookDeleteResponse,
  AddressBookGetAllResponse,
  AddressBookLookupByAddressResponse,
  AddressBookUpdateResponse,
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
  type AssetAmountInputState,
  type AddressBookEditorState,
  type AssetLimitFormState,
  type CkbTransferFormState,
  type EthTransferFormState,
  type MessageSigningFormState,
  type RotateCredentialFormState,
  type UsdcTransferFormState,
  type UsdtTransferFormState,
} from "./types/app-state";
import {
  createAmountInputFromBaseValue,
  createEmptyAmountInput,
  validateAmountInput,
  type SupportedAsset,
} from "./utils/asset-amounts";
import { getLocalizedErrorMessage, useLocalization } from "./localization";

const EMPTY_MESSAGE_SIGNING_FORM: MessageSigningFormState = {
  message: "",
  encoding: "utf8",
};

const EMPTY_CKB_TRANSFER_FORM: CkbTransferFormState = {
  to: "",
  toType: "address",
  amount: createEmptyAmountInput(),
};

const EMPTY_ETH_TRANSFER_FORM: EthTransferFormState = {
  to: "",
  toType: "address",
  amount: createEmptyAmountInput(),
};

const EMPTY_USDT_TRANSFER_FORM: UsdtTransferFormState = {
  to: "",
  toType: "address",
  amount: createEmptyAmountInput(),
};

const EMPTY_USDC_TRANSFER_FORM: UsdcTransferFormState = {
  to: "",
  toType: "address",
  amount: createEmptyAmountInput(),
};

const EMPTY_ADDRESS_BOOK_EDITOR: AddressBookEditorState = {
  currentName: null,
  name: "",
  note: "",
  nervosAddress: "",
  ethereumAddress: "",
};

export function App() {
  const refreshTokenRef = useRef(0);
  const { message, modal } = AntdApp.useApp();
  const { t } = useLocalization();
  const [appState, setAppState] = useState<AppState>(emptyAppState);
  const [authenticated, setAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
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
  const [addressBookEditor, setAddressBookEditor] =
    useState<AddressBookEditorState>(EMPTY_ADDRESS_BOOK_EDITOR);
  const [addressBookFilter, setAddressBookFilter] = useState("");
  const [addressLookupAddress, setAddressLookupAddress] = useState("");
  const [addressLookupResult, setAddressLookupResult] =
    useState<AddressBookLookupByAddressResponse | null>(null);
  const [assetLimitDrafts, setAssetLimitDrafts] = useState<
    Record<string, AssetLimitFormState>
  >({});
  const [importKey, setImportKey] = useState("");
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [nervosSignResult, setNervosSignResult] = useState("");
  const [ethereumSignResult, setEthereumSignResult] = useState("");
  const [exportedKey, setExportedKey] = useState("");

  useEffect(() => {
    void boot();
  }, []);

  async function boot() {
    try {
      await refreshAuthenticatedState({ quiet: true });
    } finally {
      setBooting(false);
    }
  }

  async function refreshAuthenticatedState(options?: { quiet?: boolean }) {
    if (!hasOwnerAccessToken()) {
      resetToLogin();
      return;
    }

    const refreshToken = ++refreshTokenRef.current;
    setRefreshing(true);

    try {
      const [credential, current, addressBook, assetLimits, audits] = await Promise.all([
        request<OwnerCredentialStatusDto>("/api/owner/credential/status"),
        callWalletTool<WalletCurrentDto>("wallet.current"),
        callWalletTool<AddressBookGetAllResponse>("address_book.get_all"),
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
        addressBookContacts: addressBook.contacts,
        assetLimits,
        audits,
      }));
      setAssetLimitDrafts(createAssetLimitDraftMap(assetLimits));

      await refreshChainState(refreshToken);

      if (!options?.quiet) {
        message.success(t("toast.refresh.success"));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        resetToLogin(t("toast.session_expired"));
        return;
      }

      message.error(getLocalizedErrorMessage(error, t, "toast.load_failed"));
    } finally {
      if (refreshToken === refreshTokenRef.current) {
        setRefreshing(false);
      }
    }
  }

  async function refreshChainState(refreshToken: number) {
    const chainTasks: Array<Promise<void>> = [
      loadChainSlice(
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
      ),
      loadChainSlice(
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
      ),
      loadChainSlice(
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
      ),
      loadChainSlice(
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
      ),
      loadChainSlice(
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
      ),
      loadChainSlice(
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
      ),
    ];

    await Promise.all(chainTasks);
  }

  async function loadChainSlice<T>(
    refreshToken: number,
    task: () => Promise<T>,
    onSuccess: (value: T) => void,
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
        resetToLogin(t("toast.session_expired"));
        return;
      }

      message.error(getLocalizedErrorMessage(error, t, "toast.chain_refresh_failed"));
    }
  }

  async function runAction(actionKey: string, task: () => Promise<void>) {
    setActiveAction(actionKey);

    try {
      await task();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        resetToLogin(
          authenticated
            ? t("toast.session_expired")
            : getLocalizedErrorMessage(error, t, "toast.action_failed"),
        );
        return;
      }

      message.error(getLocalizedErrorMessage(error, t, "toast.action_failed"));
    } finally {
      setActiveAction((current) => (current === actionKey ? null : current));
    }
  }

  function resetToLogin(nextMessage?: string) {
    clearOwnerAccessToken();
    setAuthenticated(false);
    setRefreshing(false);
    setActiveAction(null);
    setAppState(emptyAppState);
    setAssetLimitDrafts({});
    setExportedKey("");
    setImportKey("");
    setImportConfirmed(false);
    setNervosSignResult("");
    setEthereumSignResult("");
    setAddressBookEditor(EMPTY_ADDRESS_BOOK_EDITOR);
    setAddressBookFilter("");
    setAddressLookupAddress("");
    setAddressLookupResult(null);

    if (nextMessage) {
      message.warning(nextMessage);
    }
  }

  async function handleLogin() {
    const result = await request<OwnerLoginResponse>("/api/owner/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: loginPassword }),
    });
    setOwnerAccessToken(result.accessToken);
    setAuthenticated(true);
    setLoginPassword("");
    message.success(
      result.credentialStatus === "DEFAULT_PENDING_ROTATION"
        ? t("toast.login.pending_rotation")
        : t("toast.login.success"),
    );
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleLogout() {
    try {
      await request("/api/owner/auth/logout", {
        method: "POST",
      });
    } finally {
      resetToLogin(t("toast.logout.success"));
    }
  }

  async function handleRotateCredential() {
    await request("/api/owner/auth/rotate-credential", {
      method: "POST",
      body: JSON.stringify(rotateForm),
    });
    setRotateForm({ currentPassword: "", newPassword: "" });
    resetToLogin(t("toast.credential_rotated"));
  }

  async function handleNervosSignMessage() {
    const result = await callWalletTool<NervosSignMessageResponse>(
      "nervos.sign_message",
      nervosSignForm,
    );
    setNervosSignResult(formatSignResult(result.signingAddress, result.signature));
    message.success(t("toast.sign.success", { chain: "Nervos" }));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleEthereumSignMessage() {
    const result = await callWalletTool<EthereumSignMessageResponse>(
      "ethereum.sign_message",
      ethereumSignForm,
    );
    setEthereumSignResult(formatSignResult(result.signingAddress, result.signature));
    message.success(t("toast.sign.success", { chain: "Ethereum" }));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleTransferCkb() {
    const amount = requireAmount("CKB", ckbTransfer.amount, t);
    const result = await callWalletTool<NervosTransferCkbResponse>(
      "nervos.transfer.ckb",
      {
        ...ckbTransfer,
        amount,
      },
    );
    setCkbTransfer(EMPTY_CKB_TRANSFER_FORM);
    message.success(formatTransferMessage("CKB", result, t));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleTransferUsdt() {
    const amount = requireAmount("USDT", usdtTransfer.amount, t);
    const result = await callWalletTool<EthereumTransferUsdtResponse>(
      "ethereum.transfer.usdt",
      {
        ...usdtTransfer,
        amount,
      },
    );
    setUsdtTransfer(EMPTY_USDT_TRANSFER_FORM);
    message.success(formatTransferMessage("USDT", result, t));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleTransferUsdc() {
    const amount = requireAmount("USDC", usdcTransfer.amount, t);
    const result = await callWalletTool<EthereumTransferUsdcResponse>(
      "ethereum.transfer.usdc",
      {
        ...usdcTransfer,
        amount,
      },
    );
    setUsdcTransfer(EMPTY_USDC_TRANSFER_FORM);
    message.success(formatTransferMessage("USDC", result, t));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleTransferEth() {
    const amount = requireAmount("ETH", ethTransfer.amount, t);
    const result = await callWalletTool<EthereumTransferEthResponse>(
      "ethereum.transfer.eth",
      {
        ...ethTransfer,
        amount,
      },
    );
    setEthTransfer(EMPTY_ETH_TRANSFER_FORM);
    message.success(formatTransferMessage("ETH", result, t));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleSaveAddressBookContact() {
    const name = addressBookEditor.name.trim();
    const note = addressBookEditor.note.trim();
    const nervosAddress = addressBookEditor.nervosAddress.trim();
    const ethereumAddress = addressBookEditor.ethereumAddress.trim();

    if (addressBookEditor.currentName) {
      const result = await callWalletTool<AddressBookUpdateResponse>("address_book.update", {
        currentName: addressBookEditor.currentName,
        contact: {
          name,
          note: note ? note : null,
          addresses: {
            nervosAddress: nervosAddress || null,
            ethereumAddress: ethereumAddress || null,
          },
        },
      });

      setAddressBookEditor(createAddressBookEditor(result.contact));
      message.success(t("toast.contact.updated", { name: result.contact.name }));
    } else {
      const addresses: Record<string, string> = {};
      if (nervosAddress) {
        addresses.nervosAddress = nervosAddress;
      }
      if (ethereumAddress) {
        addresses.ethereumAddress = ethereumAddress;
      }

      const result = await callWalletTool<AddressBookCreateResponse>("address_book.create", {
        contact: {
          name,
          note: note ? note : null,
          addresses,
        },
      });

      setAddressBookEditor(createAddressBookEditor(result.contact));
      message.success(t("toast.contact.created", { name: result.contact.name }));
    }

    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleDeleteAddressBookContact() {
    if (!addressBookEditor.currentName) {
      message.warning(t("toast.contact.delete_requires_selection"));
      return;
    }

    const result = await callWalletTool<AddressBookDeleteResponse>("address_book.delete", {
      name: addressBookEditor.currentName,
    });
    setAddressBookEditor(EMPTY_ADDRESS_BOOK_EDITOR);
    message.success(t("toast.contact.deleted", { name: result.name }));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleLookupAddressBook() {
    const result = await callWalletTool<AddressBookLookupByAddressResponse>(
      "address_book.lookup_by_address",
      {
        address: addressLookupAddress,
      },
    );
    setAddressLookupResult(result);
    if (result.matched) {
      message.success(t("toast.address_lookup.success"));
      return;
    }

    message.info(t("toast.address_lookup.not_matched"));
  }

  async function handleSaveAssetLimit(key: string) {
    const limit = appState.assetLimits.find((entry) => createLimitKey(entry) === key);
    const draft = assetLimitDrafts[key];

    if (!limit || !draft) {
      message.warning(t("toast.limit.not_found"));
      return;
    }

    await request<OwnerAssetLimitEntryDto>(`/api/owner/asset-limits/${limit.chain}/${limit.asset}`, {
      method: "PUT",
      body: JSON.stringify({
        dailyLimit: optionalAmount(limit.asset as SupportedAsset, draft.dailyLimit, t),
        weeklyLimit: optionalAmount(limit.asset as SupportedAsset, draft.weeklyLimit, t),
        monthlyLimit: optionalAmount(limit.asset as SupportedAsset, draft.monthlyLimit, t),
      }),
    });
    message.success(t("toast.limit.saved", { asset: limit.asset }));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleImportWallet() {
    if (!importConfirmed) {
      message.warning(t("toast.import.requires_confirmation"));
      return;
    }

    await request("/api/owner/wallet/import", {
      method: "POST",
      body: JSON.stringify({ privateKey: importKey, confirmed: true }),
    });
    setImportKey("");
    setImportConfirmed(false);
    message.success(t("toast.wallet.imported"));
    await refreshAuthenticatedState({ quiet: true });
  }

  async function handleExportWallet() {
    const result = await request<OwnerWalletExportResponse>("/api/owner/wallet/export", {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    });
    setExportedKey(result.privateKey);
    message.success(t("toast.wallet.exported"));
    await refreshAuthenticatedState({ quiet: true });
  }

  function confirmImportWallet() {
    void modal.confirm({
      title: t("modal.import.title"),
      content: t("modal.import.content"),
      okText: t("modal.import.confirm"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: async () => runAction("import-wallet", handleImportWallet),
    });
  }

  function confirmExportWallet() {
    void modal.confirm({
      title: t("modal.export.title"),
      content: t("modal.export.content"),
      okText: t("modal.export.confirm"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: async () => runAction("export-wallet", handleExportWallet),
    });
  }

  if (booting) {
    return <div className="screen-center">{t("app.loading")}</div>;
  }

  if (!authenticated) {
    return (
      <LoginScreen
        isPending={activeAction === "login"}
        loginPassword={loginPassword}
        onLoginPasswordChange={setLoginPassword}
        onSubmit={() => void runAction("login", handleLogin)}
      />
    );
  }

  return (
    <DashboardScreen
      activeAction={activeAction}
      appState={appState}
      addressBookEditor={addressBookEditor}
      addressBookFilter={addressBookFilter}
      addressLookupAddress={addressLookupAddress}
      addressLookupResult={addressLookupResult}
      ckbTransfer={ckbTransfer}
      ethTransfer={ethTransfer}
      ethereumSignForm={ethereumSignForm}
      ethereumSignResult={ethereumSignResult}
      exportedKey={exportedKey}
      importConfirmed={importConfirmed}
      importKey={importKey}
      isRefreshing={refreshing}
      nervosSignForm={nervosSignForm}
      nervosSignResult={nervosSignResult}
      rotateForm={rotateForm}
      assetLimitDrafts={assetLimitDrafts}
      usdcTransfer={usdcTransfer}
      usdtTransfer={usdtTransfer}
      onRefresh={() => void refreshAuthenticatedState()}
      onCkbAmountChange={(value) =>
        setCkbTransfer((current) => ({
          ...current,
          amount: { ...current.amount, value },
        }))
      }
      onCkbAmountUnitChange={(unit) =>
        setCkbTransfer((current) => ({
          ...current,
          amount: { ...current.amount, unit },
        }))
      }
      onCkbSubmit={() => void runAction("transfer-ckb", handleTransferCkb)}
      onCkbToChange={(value) =>
        setCkbTransfer((current) => ({ ...current, to: value }))
      }
      onEthAmountChange={(value) =>
        setEthTransfer((current) => ({
          ...current,
          amount: { ...current.amount, value },
        }))
      }
      onEthAmountUnitChange={(unit) =>
        setEthTransfer((current) => ({
          ...current,
          amount: { ...current.amount, unit },
        }))
      }
      onEthSubmit={() => void runAction("transfer-eth", handleTransferEth)}
      onEthToChange={(value) =>
        setEthTransfer((current) => ({ ...current, to: value }))
      }
      onEthereumSignEncodingChange={(value) =>
        setEthereumSignForm((current) => ({ ...current, encoding: value }))
      }
      onEthereumSignMessageChange={(value) =>
        setEthereumSignForm((current) => ({ ...current, message: value }))
      }
      onEthereumSignSubmit={() =>
        void runAction("sign-ethereum", handleEthereumSignMessage)
      }
      onExport={confirmExportWallet}
      onImport={confirmImportWallet}
      onImportConfirmedChange={setImportConfirmed}
      onImportKeyChange={setImportKey}
      onLogout={() => void runAction("logout", handleLogout)}
      onNervosSignEncodingChange={(value) =>
        setNervosSignForm((current) => ({ ...current, encoding: value }))
      }
      onNervosSignMessageChange={(value) =>
        setNervosSignForm((current) => ({ ...current, message: value }))
      }
      onNervosSignSubmit={() => void runAction("sign-nervos", handleNervosSignMessage)}
      onRotateCurrentPasswordChange={(value) =>
        setRotateForm((current) => ({ ...current, currentPassword: value }))
      }
      onRotateNewPasswordChange={(value) =>
        setRotateForm((current) => ({ ...current, newPassword: value }))
      }
      onRotateSubmit={() => void runAction("rotate-credential", handleRotateCredential)}
      onAssetLimitChange={(key, field, value) =>
        setAssetLimitDrafts((current) => ({
          ...current,
          [key]: {
            ...(current[key] ?? {
              dailyLimit: createEmptyAmountInput(),
              weeklyLimit: createEmptyAmountInput(),
              monthlyLimit: createEmptyAmountInput(),
            }),
            [field]: {
              ...(current[key]?.[field] ?? createEmptyAmountInput()),
              value,
            },
          },
        }))
      }
      onAssetLimitUnitChange={(key, field, unit) =>
        setAssetLimitDrafts((current) => ({
          ...current,
          [key]: {
            ...(current[key] ?? {
              dailyLimit: createEmptyAmountInput(),
              weeklyLimit: createEmptyAmountInput(),
              monthlyLimit: createEmptyAmountInput(),
            }),
            [field]: {
              ...(current[key]?.[field] ?? createEmptyAmountInput()),
              unit,
            },
          },
        }))
      }
      onAssetLimitSave={(key) => void runAction(`limit:${key}`, () => handleSaveAssetLimit(key))}
      onAddressBookDelete={() => runAction("address-book-delete", handleDeleteAddressBookContact)}
      onAddressBookEditorChange={(field, value) =>
        setAddressBookEditor((current) => ({
          ...current,
          [field]: value,
        }))
      }
      onAddressBookFilterChange={setAddressBookFilter}
      onAddressBookLookup={() => void runAction("address-book-lookup", handleLookupAddressBook)}
      onAddressBookLookupAddressChange={setAddressLookupAddress}
      onAddressBookReset={() => setAddressBookEditor(EMPTY_ADDRESS_BOOK_EDITOR)}
      onAddressBookSave={() => runAction("address-book-save", handleSaveAddressBookContact)}
      onAddressBookSelect={(contact) => setAddressBookEditor(createAddressBookEditor(contact))}
      onUsdcAmountChange={(value) =>
        setUsdcTransfer((current) => ({
          ...current,
          amount: { ...current.amount, value },
        }))
      }
      onUsdcAmountUnitChange={(unit) =>
        setUsdcTransfer((current) => ({
          ...current,
          amount: { ...current.amount, unit },
        }))
      }
      onUsdcSubmit={() => void runAction("transfer-usdc", handleTransferUsdc)}
      onUsdcToChange={(value) =>
        setUsdcTransfer((current) => ({ ...current, to: value }))
      }
      onUsdcToTypeChange={(value) =>
        setUsdcTransfer((current) => ({ ...current, toType: value }))
      }
      onUsdtAmountChange={(value) =>
        setUsdtTransfer((current) => ({
          ...current,
          amount: { ...current.amount, value },
        }))
      }
      onUsdtAmountUnitChange={(unit) =>
        setUsdtTransfer((current) => ({
          ...current,
          amount: { ...current.amount, unit },
        }))
      }
      onUsdtSubmit={() => void runAction("transfer-usdt", handleTransferUsdt)}
      onUsdtToChange={(value) =>
        setUsdtTransfer((current) => ({ ...current, to: value }))
      }
      onUsdtToTypeChange={(value) =>
        setUsdtTransfer((current) => ({ ...current, toType: value }))
      }
      onCkbToTypeChange={(value) =>
        setCkbTransfer((current) => ({ ...current, toType: value }))
      }
      onEthToTypeChange={(value) =>
        setEthTransfer((current) => ({ ...current, toType: value }))
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
        dailyLimit: createAmountInputFromBaseValue(limit.asset as SupportedAsset, limit.dailyLimit),
        weeklyLimit: createAmountInputFromBaseValue(limit.asset as SupportedAsset, limit.weeklyLimit),
        monthlyLimit: createAmountInputFromBaseValue(limit.asset as SupportedAsset, limit.monthlyLimit),
      },
    ]),
  );
}

function createAddressBookEditor(
  contact: AppState["addressBookContacts"][number],
): AddressBookEditorState {
  return {
    currentName: contact.name,
    name: contact.name,
    note: contact.note ?? "",
    nervosAddress: contact.addresses.nervosAddress ?? "",
    ethereumAddress: contact.addresses.ethereumAddress ?? "",
  };
}

function formatTransferMessage(
  asset: "CKB" | "ETH" | "USDT" | "USDC",
  result:
    | NervosTransferCkbResponse
    | EthereumTransferEthResponse
    | EthereumTransferUsdtResponse
    | EthereumTransferUsdcResponse,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  const targetLabel = result.contactName
    ? `${result.contactName} (${result.resolvedAddress})`
    : result.resolvedAddress;
  return t("toast.transfer.success", {
    asset,
    operationId: result.operationId,
    target: targetLabel,
  });
}

function requireAmount(
  asset: SupportedAsset,
  input: AssetAmountInputState,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  const result = validateAmountInput(
    asset,
    input,
    {
      requirePositive: true,
    },
    t,
  );
  if (result.error || !result.baseValue) {
    throw new Error(result.error ?? t("toast.action_failed"));
  }

  return result.baseValue;
}

function optionalAmount(
  asset: SupportedAsset,
  input: AssetAmountInputState,
  t: ReturnType<typeof useLocalization>["t"],
): string | null {
  const result = validateAmountInput(
    asset,
    input,
    {
      allowEmpty: true,
    },
    t,
  );
  if (result.error) {
    throw new Error(result.error);
  }

  return result.baseValue;
}

function createLimitKey(limit: Pick<OwnerAssetLimitEntryDto, "chain" | "asset">): string {
  return `${limit.chain}:${limit.asset}`;
}
