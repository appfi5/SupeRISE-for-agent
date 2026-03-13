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
  onCkbToTypeChange: (value: "address" | "contact_name") => void;
  onEthAmountChange: (value: string) => void;
  onEthSubmit: () => void;
  onEthToChange: (value: string) => void;
  onEthToTypeChange: (value: "address" | "contact_name") => void;
  onUsdtAmountChange: (value: string) => void;
  onUsdtSubmit: () => void;
  onUsdtToChange: (value: string) => void;
  onUsdtToTypeChange: (value: "address" | "contact_name") => void;
  onUsdcAmountChange: (value: string) => void;
  onUsdcSubmit: () => void;
  onUsdcToChange: (value: string) => void;
  onUsdcToTypeChange: (value: "address" | "contact_name") => void;
};

export function TransferPanels({
  ckbTransfer,
  ethTransfer,
  usdcTransfer,
  usdtTransfer,
  onCkbAmountChange,
  onCkbSubmit,
  onCkbToChange,
  onCkbToTypeChange,
  onEthAmountChange,
  onEthSubmit,
  onEthToChange,
  onEthToTypeChange,
  onUsdtAmountChange,
  onUsdtSubmit,
  onUsdtToChange,
  onUsdtToTypeChange,
  onUsdcAmountChange,
  onUsdcSubmit,
  onUsdcToChange,
  onUsdcToTypeChange,
}: TransferPanelsProps) {
  return (
    <>
      <section className="grid two-up">
        <article className="panel">
          <h2>Nervos CKB 转账</h2>
          <label className="field">
            <span>目标类型</span>
            <select
              value={ckbTransfer.toType}
              onChange={(event) =>
                onCkbToTypeChange(event.target.value as "address" | "contact_name")
              }
            >
              <option value="address">原始地址</option>
              <option value="contact_name">联系人名称</option>
            </select>
          </label>
          <label className="field">
            <span>{ckbTransfer.toType === "address" ? "目标地址" : "联系人名称"}</span>
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
            <span>目标类型</span>
            <select
              value={ethTransfer.toType}
              onChange={(event) =>
                onEthToTypeChange(event.target.value as "address" | "contact_name")
              }
            >
              <option value="address">原始地址</option>
              <option value="contact_name">联系人名称</option>
            </select>
          </label>
          <label className="field">
            <span>{ethTransfer.toType === "address" ? "目标地址" : "联系人名称"}</span>
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
            <span>目标类型</span>
            <select
              value={usdtTransfer.toType}
              onChange={(event) =>
                onUsdtToTypeChange(event.target.value as "address" | "contact_name")
              }
            >
              <option value="address">原始地址</option>
              <option value="contact_name">联系人名称</option>
            </select>
          </label>
          <label className="field">
            <span>{usdtTransfer.toType === "address" ? "目标地址" : "联系人名称"}</span>
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
            <span>目标类型</span>
            <select
              value={usdcTransfer.toType}
              onChange={(event) =>
                onUsdcToTypeChange(event.target.value as "address" | "contact_name")
              }
            >
              <option value="address">原始地址</option>
              <option value="contact_name">联系人名称</option>
            </select>
          </label>
          <label className="field">
            <span>{usdcTransfer.toType === "address" ? "目标地址" : "联系人名称"}</span>
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
