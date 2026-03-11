import { OWNER_RISK_NOTICES, type AppState } from "../types/app-state";

type WalletStatusPanelsProps = {
  appState: AppState;
};

export function WalletStatusPanels({ appState }: WalletStatusPanelsProps) {
  return (
    <>
      <section className="grid two-up">
        <article className="panel">
          <h2>当前钱包</h2>
          <dl className="metrics">
            <div>
              <dt>Fingerprint</dt>
              <dd>{appState.current?.walletFingerprint ?? "-"}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{appState.current?.status ?? "-"}</dd>
            </div>
            <div>
              <dt>来源</dt>
              <dd>{appState.current?.source ?? "-"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>风险说明</h2>
          <ul className="plain-list">
            {OWNER_RISK_NOTICES.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
          <p className="tag">
            凭证状态：{appState.credential?.credentialStatus ?? "UNKNOWN"}
          </p>
        </article>
      </section>

      <section className="grid two-up">
        <article className="panel">
          <h2>Nervos / CKB</h2>
          <dl className="metrics">
            <div>
              <dt>地址</dt>
              <dd>{appState.nervos.address?.address ?? "-"}</dd>
            </div>
            <div>
              <dt>余额</dt>
              <dd>
                {formatAssetAmount(
                  appState.nervos.ckbBalance?.amount,
                  appState.nervos.ckbBalance?.decimals,
                  "CKB",
                )}
              </dd>
            </div>
          </dl>
        </article>
        <article className="panel">
          <h2>Ethereum</h2>
          <dl className="metrics">
            <div>
              <dt>地址</dt>
              <dd>{appState.ethereum.address?.address ?? "-"}</dd>
            </div>
            <div>
              <dt>ETH 余额</dt>
              <dd>
                {formatAssetAmount(
                  appState.ethereum.ethBalance?.amount,
                  appState.ethereum.ethBalance?.decimals,
                  "ETH",
                )}
              </dd>
            </div>
            <div>
              <dt>USDT 余额</dt>
              <dd>
                {formatAssetAmount(
                  appState.ethereum.usdtBalance?.amount,
                  appState.ethereum.usdtBalance?.decimals,
                  "USDT",
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </>
  );
}

function formatAssetAmount(
  amount: string | undefined,
  decimals: number | undefined,
  asset: string,
): string {
  if (!amount || decimals === undefined) {
    return "-";
  }

  return `${toDisplayAmount(amount, decimals)} ${asset} (raw: ${amount}, decimals: ${decimals})`;
}

function toDisplayAmount(amount: string, decimals: number): string {
  if (decimals === 0) {
    return amount;
  }

  const normalized = amount.replace(/^0+(?=\d)/, "");
  const padded = normalized.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole;
}
