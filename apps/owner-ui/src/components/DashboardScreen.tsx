import { AddressBookPanel } from "./AddressBookPanel";
import { AssetLimitPanel } from "./AssetLimitPanel";
import { AuditLogPanel } from "./AuditLogPanel";
import { CredentialPanel } from "./CredentialPanel";
import { RecoveryPanels } from "./RecoveryPanels";
import { SignMessagePanel } from "./SignMessagePanel";
import { TransferPanels } from "./TransferPanels";
import { WalletStatusPanels } from "./WalletStatusPanels";
import type {
  AppState,
  AddressBookEditorState,
  AssetLimitFormState,
  CkbTransferFormState,
  EthTransferFormState,
  MessageSigningFormState,
  RotateCredentialFormState,
  UsdcTransferFormState,
  UsdtTransferFormState,
} from "../types/app-state";

type DashboardScreenProps = {
  appState: AppState;
  addressBookEditor: AddressBookEditorState;
  addressBookFilter: string;
  addressLookupAddress: string;
  addressLookupResult: import("@superise/app-contracts").AddressBookLookupByAddressResponse | null;
  ckbTransfer: CkbTransferFormState;
  ethTransfer: EthTransferFormState;
  ethereumSignForm: MessageSigningFormState;
  ethereumSignResult: string;
  exportedKey: string;
  importConfirmed: boolean;
  importKey: string;
  message: string;
  nervosSignForm: MessageSigningFormState;
  nervosSignResult: string;
  rotateForm: RotateCredentialFormState;
  assetLimitDrafts: Record<string, AssetLimitFormState>;
  usdcTransfer: UsdcTransferFormState;
  usdtTransfer: UsdtTransferFormState;
  onCkbAmountChange: (value: string) => void;
  onCkbSubmit: () => void;
  onCkbToChange: (value: string) => void;
  onEthAmountChange: (value: string) => void;
  onEthSubmit: () => void;
  onEthToChange: (value: string) => void;
  onEthereumSignEncodingChange: (value: MessageSigningFormState["encoding"]) => void;
  onEthereumSignMessageChange: (value: string) => void;
  onEthereumSignSubmit: () => void;
  onExport: () => void;
  onImport: () => void;
  onImportConfirmedChange: (value: boolean) => void;
  onImportKeyChange: (value: string) => void;
  onLogout: () => void;
  onNervosSignEncodingChange: (value: MessageSigningFormState["encoding"]) => void;
  onNervosSignMessageChange: (value: string) => void;
  onNervosSignSubmit: () => void;
  onRotateCurrentPasswordChange: (value: string) => void;
  onRotateNewPasswordChange: (value: string) => void;
  onRotateSubmit: () => void;
  onAssetLimitChange: (
    key: string,
    field: keyof AssetLimitFormState,
    value: string,
  ) => void;
  onAssetLimitSave: (key: string) => void;
  onAddressBookDelete: () => void;
  onAddressBookEditorChange: (
    field: keyof Omit<AddressBookEditorState, "currentName">,
    value: string,
  ) => void;
  onAddressBookFilterChange: (value: string) => void;
  onAddressBookLookup: () => void;
  onAddressBookLookupAddressChange: (value: string) => void;
  onAddressBookReset: () => void;
  onAddressBookSave: () => void;
  onAddressBookSelect: (contact: AppState["addressBookContacts"][number]) => void;
  onUsdtAmountChange: (value: string) => void;
  onUsdtSubmit: () => void;
  onUsdtToChange: (value: string) => void;
  onUsdtToTypeChange: (value: "address" | "contact_name") => void;
  onUsdcAmountChange: (value: string) => void;
  onUsdcSubmit: () => void;
  onUsdcToChange: (value: string) => void;
  onUsdcToTypeChange: (value: "address" | "contact_name") => void;
  onCkbToTypeChange: (value: "address" | "contact_name") => void;
  onEthToTypeChange: (value: "address" | "contact_name") => void;
};

export function DashboardScreen({
  appState,
  addressBookEditor,
  addressBookFilter,
  addressLookupAddress,
  addressLookupResult,
  ckbTransfer,
  ethTransfer,
  ethereumSignForm,
  ethereumSignResult,
  exportedKey,
  importConfirmed,
  importKey,
  message,
  nervosSignForm,
  nervosSignResult,
  rotateForm,
  assetLimitDrafts,
  usdcTransfer,
  usdtTransfer,
  onCkbAmountChange,
  onCkbSubmit,
  onCkbToChange,
  onEthAmountChange,
  onEthSubmit,
  onEthToChange,
  onEthereumSignEncodingChange,
  onEthereumSignMessageChange,
  onEthereumSignSubmit,
  onExport,
  onImport,
  onImportConfirmedChange,
  onImportKeyChange,
  onLogout,
  onNervosSignEncodingChange,
  onNervosSignMessageChange,
  onNervosSignSubmit,
  onRotateCurrentPasswordChange,
  onRotateNewPasswordChange,
  onRotateSubmit,
  onAssetLimitChange,
  onAssetLimitSave,
  onAddressBookDelete,
  onAddressBookEditorChange,
  onAddressBookFilterChange,
  onAddressBookLookup,
  onAddressBookLookupAddressChange,
  onAddressBookReset,
  onAddressBookSave,
  onAddressBookSelect,
  onUsdtAmountChange,
  onUsdtSubmit,
  onUsdtToChange,
  onUsdtToTypeChange,
  onUsdcAmountChange,
  onUsdcSubmit,
  onUsdcToChange,
  onUsdcToTypeChange,
  onCkbToTypeChange,
  onEthToTypeChange,
}: DashboardScreenProps) {
  return (
    <main className="shell dashboard-shell">
      <section className="hero compact">
        <div>
          <p className="eyebrow">SupeRISE Owner Mode</p>
          <h1>单钱包控制台</h1>
          <p className="lede">
            当前钱包按链展示状态，默认只看身份和余额，不在产品内默认铺开交易细节。
          </p>
        </div>
        <button className="button ghost" onClick={onLogout}>
          退出
        </button>
      </section>

      {message ? <div className="flash">{message}</div> : null}

      <WalletStatusPanels appState={appState} />

      <section className="grid two-up">
        <CredentialPanel
          value={rotateForm}
          onCurrentPasswordChange={onRotateCurrentPasswordChange}
          onNewPasswordChange={onRotateNewPasswordChange}
          onSubmit={onRotateSubmit}
        />
        <SignMessagePanel
          title="Nervos 消息签名"
          submitLabel="提交 Nervos 签名"
          result={nervosSignResult}
          value={nervosSignForm}
          onEncodingChange={onNervosSignEncodingChange}
          onMessageChange={onNervosSignMessageChange}
          onSubmit={onNervosSignSubmit}
        />
      </section>

      <section className="grid two-up">
        <SignMessagePanel
          title="Ethereum 消息签名"
          submitLabel="提交 Ethereum 签名"
          result={ethereumSignResult}
          value={ethereumSignForm}
          onEncodingChange={onEthereumSignEncodingChange}
          onMessageChange={onEthereumSignMessageChange}
          onSubmit={onEthereumSignSubmit}
        />
      </section>

      <AssetLimitPanel
        limits={appState.assetLimits}
        drafts={assetLimitDrafts}
        onChange={onAssetLimitChange}
        onSave={(limit) => onAssetLimitSave(`${limit.chain}:${limit.asset}`)}
      />

      <AddressBookPanel
        contacts={appState.addressBookContacts}
        editor={addressBookEditor}
        filter={addressBookFilter}
        lookupAddress={addressLookupAddress}
        lookupResult={addressLookupResult}
        onDelete={onAddressBookDelete}
        onEditorChange={onAddressBookEditorChange}
        onFilterChange={onAddressBookFilterChange}
        onLookup={onAddressBookLookup}
        onLookupAddressChange={onAddressBookLookupAddressChange}
        onReset={onAddressBookReset}
        onSave={onAddressBookSave}
        onSelectContact={onAddressBookSelect}
      />

      <TransferPanels
        ckbTransfer={ckbTransfer}
        ethTransfer={ethTransfer}
        usdcTransfer={usdcTransfer}
        usdtTransfer={usdtTransfer}
        onCkbAmountChange={onCkbAmountChange}
        onCkbSubmit={onCkbSubmit}
        onCkbToChange={onCkbToChange}
        onCkbToTypeChange={onCkbToTypeChange}
        onEthAmountChange={onEthAmountChange}
        onEthSubmit={onEthSubmit}
        onEthToChange={onEthToChange}
        onEthToTypeChange={onEthToTypeChange}
        onUsdcAmountChange={onUsdcAmountChange}
        onUsdcSubmit={onUsdcSubmit}
        onUsdcToChange={onUsdcToChange}
        onUsdcToTypeChange={onUsdcToTypeChange}
        onUsdtAmountChange={onUsdtAmountChange}
        onUsdtSubmit={onUsdtSubmit}
        onUsdtToChange={onUsdtToChange}
        onUsdtToTypeChange={onUsdtToTypeChange}
      />

      <RecoveryPanels
        exportedKey={exportedKey}
        importConfirmed={importConfirmed}
        importKey={importKey}
        onExport={onExport}
        onImport={onImport}
        onImportConfirmedChange={onImportConfirmedChange}
        onImportKeyChange={onImportKeyChange}
      />

      <AuditLogPanel audits={appState.audits} />
    </main>
  );
}
