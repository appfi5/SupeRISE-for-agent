import type { OwnerAssetLimitEntryDto } from "@superise/app-contracts";
import type { AssetLimitFormState } from "../types/app-state";

type AssetLimitPanelProps = {
  limits: OwnerAssetLimitEntryDto[];
  drafts: Record<string, AssetLimitFormState>;
  onChange: (
    key: string,
    field: keyof AssetLimitFormState,
    value: string,
  ) => void;
  onSave: (limit: OwnerAssetLimitEntryDto) => void;
};

export function AssetLimitPanel({
  limits,
  drafts,
  onChange,
  onSave,
}: AssetLimitPanelProps) {
  return (
    <section className="grid two-up">
      {limits.map((limit) => {
        const key = createLimitKey(limit);
        const draft = drafts[key] ?? {
          dailyLimit: "",
          weeklyLimit: "",
          monthlyLimit: "",
        };

        return (
          <article className="panel" key={key}>
            <h2>
              {limit.chain === "nervos" ? "Nervos" : "Ethereum"} / {limit.asset} 限额
            </h2>
            <p className="hint">单位为最小单位整数；输入留空表示该周期不限额。</p>

            <label className="field">
              <span>日限额</span>
              <input
                placeholder="留空表示不限额"
                value={draft.dailyLimit}
                onChange={(event) => onChange(key, "dailyLimit", event.target.value)}
              />
            </label>
            <label className="field">
              <span>周限额</span>
              <input
                placeholder="留空表示不限额"
                value={draft.weeklyLimit}
                onChange={(event) => onChange(key, "weeklyLimit", event.target.value)}
              />
            </label>
            <label className="field">
              <span>月限额</span>
              <input
                placeholder="留空表示不限额"
                value={draft.monthlyLimit}
                onChange={(event) => onChange(key, "monthlyLimit", event.target.value)}
              />
            </label>

            <div className="window-grid">
              {renderWindowCard("日", limit.usage.daily)}
              {renderWindowCard("周", limit.usage.weekly)}
              {renderWindowCard("月", limit.usage.monthly)}
            </div>

            <button className="button primary" onClick={() => onSave(limit)}>
              保存 {limit.asset} 限额
            </button>
          </article>
        );
      })}
    </section>
  );
}

function renderWindowCard(
  label: string,
  usage: OwnerAssetLimitEntryDto["usage"]["daily"],
) {
  return (
    <div className="window-card" key={label}>
      <strong>{label}窗口</strong>
      <span>配置：{formatMaybeAmount(usage.limitAmount)}</span>
      <span>已消耗：{usage.consumedAmount}</span>
      <span>已预占：{usage.reservedAmount}</span>
      <span>有效已用：{usage.effectiveUsedAmount}</span>
      <span>剩余额度：{formatMaybeAmount(usage.remainingAmount)}</span>
      <span>重置时间：{usage.resetsAt}</span>
    </div>
  );
}

function formatMaybeAmount(value: string | null): string {
  return value ?? "不限额";
}

export function createLimitKey(limit: Pick<OwnerAssetLimitEntryDto, "chain" | "asset">): string {
  return `${limit.chain}:${limit.asset}`;
}
