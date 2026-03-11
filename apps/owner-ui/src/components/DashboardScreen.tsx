import { AuditLogPanel } from "./AuditLogPanel";
import { CredentialPanel } from "./CredentialPanel";
import { RecoveryPanels } from "./RecoveryPanels";
import { SignMessagePanel } from "./SignMessagePanel";
import { TransferPanels } from "./TransferPanels";
import { WalletStatusPanels } from "./WalletStatusPanels";
import type {
  AppState,
  CkbTransferFormState,
  EthTransferFormState,
  MessageSigningFormState,
  RotateCredentialFormState,
  UsdtTransferFormState,
} from "../types/app-state";

type DashboardScreenProps = {
  appState: AppState;
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
  onUsdtAmountChange: (value: string) => void;
  onUsdtSubmit: () => void;
  onUsdtToChange: (value: string) => void;
};

export function DashboardScreen({
  appState,
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
  onUsdtAmountChange,
  onUsdtSubmit,
  onUsdtToChange,
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

      <TransferPanels
        ckbTransfer={ckbTransfer}
        ethTransfer={ethTransfer}
        usdtTransfer={usdtTransfer}
        onCkbAmountChange={onCkbAmountChange}
        onCkbSubmit={onCkbSubmit}
        onCkbToChange={onCkbToChange}
        onEthAmountChange={onEthAmountChange}
        onEthSubmit={onEthSubmit}
        onEthToChange={onEthToChange}
        onUsdtAmountChange={onUsdtAmountChange}
        onUsdtSubmit={onUsdtSubmit}
        onUsdtToChange={onUsdtToChange}
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
