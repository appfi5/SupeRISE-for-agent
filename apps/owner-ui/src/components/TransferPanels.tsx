import type {
  CkbTransferFormState,
  EthTransferFormState,
  UsdcTransferFormState,
  UsdtTransferFormState,
} from "../types/app-state";

type TransferPanelsProps = {
  ckbTransfer: CkbTransferFormState;
  ethTransfer: EthTransferFormState;
  usdtTransfer: UsdtTransferFormState;
  usdcTransfer: UsdcTransferFormState;
  onCkbAmountChange: (value: string) => void;
  onCkbSubmit: () => void;
  onCkbToChange: (value: string) => void;
  onEthAmountChange: (value: string) => void;
  onEthSubmit: () => void;
  onEthToChange: (value: string) => void;
  onUsdtAmountChange: (value: string) => void;
  onUsdtSubmit: () => void;
  onUsdtToChange: (value: string) => void;
  onUsdcAmountChange: (value: string) => void;
  onUsdcSubmit: () => void;
  onUsdcToChange: (value: string) => void;
};

export function TransferPanels({
  ckbTransfer,
  ethTransfer,
  usdcTransfer,
  usdtTransfer,
  onCkbAmountChange,
  onCkbSubmit,
  onCkbToChange,
  onEthAmountChange,
  onEthSubmit,
  onEthToChange,
  onUsdtAmountChange,
  onUsdtSubmit,
  onUsdtToChange,
  onUsdcAmountChange,
  onUsdcSubmit,
  onUsdcToChange,
}: TransferPanelsProps) {
  return (
    <>
      <section className="grid two-up">
        <article className="panel">
          <h2>Nervos CKB 转账</h2>
          <label className="field">
            <span>目标地址</span>
            <input
              value={ckbTransfer.to}
              onChange={(event) => onCkbToChange(event.target.value)}
            />
          </label>
          <label className="field">
            <span>数量（最小单位整数，100000000 = 1 CKB）</span>
            <input
              placeholder="例如 100000000"
              value={ckbTransfer.amount}
              onChange={(event) => onCkbAmountChange(event.target.value)}
            />
          </label>
          <button className="button primary" onClick={onCkbSubmit}>
            提交 CKB 转账
          </button>
        </article>

        <article className="panel">
          <h2>Ethereum ETH 转账</h2>
          <label className="field">
            <span>目标地址</span>
            <input
              value={ethTransfer.to}
              onChange={(event) => onEthToChange(event.target.value)}
            />
          </label>
          <label className="field">
            <span>数量（最小单位整数，1000000000000000000 = 1 ETH）</span>
            <input
              placeholder="例如 1000000000000000000"
              value={ethTransfer.amount}
              onChange={(event) => onEthAmountChange(event.target.value)}
            />
          </label>
          <button className="button primary" onClick={onEthSubmit}>
            提交 ETH 转账
          </button>
        </article>
      </section>

      <section className="grid two-up">
        <article className="panel">
          <h2>Ethereum USDT 转账</h2>
          <label className="field">
            <span>目标地址</span>
            <input
              value={usdtTransfer.to}
              onChange={(event) => onUsdtToChange(event.target.value)}
            />
          </label>
          <label className="field">
            <span>数量（最小单位整数，1000000 = 1 USDT）</span>
            <input
              placeholder="例如 1000000"
              value={usdtTransfer.amount}
              onChange={(event) => onUsdtAmountChange(event.target.value)}
            />
          </label>
          <button className="button primary" onClick={onUsdtSubmit}>
            提交 USDT 转账
          </button>
        </article>

        <article className="panel">
          <h2>Ethereum USDC 转账</h2>
          <label className="field">
            <span>目标地址</span>
            <input
              value={usdcTransfer.to}
              onChange={(event) => onUsdcToChange(event.target.value)}
            />
          </label>
          <label className="field">
            <span>数量（最小单位整数，1000000 = 1 USDC）</span>
            <input
              placeholder="例如 1000000"
              value={usdcTransfer.amount}
              onChange={(event) => onUsdcAmountChange(event.target.value)}
            />
          </label>
          <button className="button primary" onClick={onUsdcSubmit}>
            提交 USDC 转账
          </button>
        </article>
      </section>
    </>
  );
}
