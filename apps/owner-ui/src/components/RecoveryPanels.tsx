type RecoveryPanelsProps = {
  exportedKey: string;
  importKey: string;
  importConfirmed: boolean;
  onExport: () => void;
  onImport: () => void;
  onImportConfirmedChange: (value: boolean) => void;
  onImportKeyChange: (value: string) => void;
};

export function RecoveryPanels({
  exportedKey,
  importKey,
  importConfirmed,
  onExport,
  onImport,
  onImportConfirmedChange,
  onImportKeyChange,
}: RecoveryPanelsProps) {
  return (
    <section className="grid two-up">
      <article className="panel warning">
        <h2>导入恢复</h2>
        <p className="hint">导入会直接替换当前唯一钱包，请只在恢复场景下执行。</p>
        <label className="field">
          <span>私钥</span>
          <textarea
            rows={4}
            value={importKey}
            onChange={(event) => onImportKeyChange(event.target.value)}
          />
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={importConfirmed}
            onChange={(event) => onImportConfirmedChange(event.target.checked)}
          />
          <span>我确认导入会直接替换当前唯一钱包。</span>
        </label>
        <button
          className="button danger"
          disabled={!importConfirmed || importKey.trim().length === 0}
          onClick={onImport}
        >
          导入并替换钱包
        </button>
      </article>

      <article className="panel warning">
        <h2>高风险导出</h2>
        <p className="hint">导出私钥后，Owner 将直接掌握钱包控制权，请按高风险操作处理。</p>
        <button className="button danger" onClick={onExport}>
          导出私钥
        </button>
        {exportedKey ? <pre className="result-box">{exportedKey}</pre> : null}
      </article>
    </section>
  );
}
