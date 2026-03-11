import type { MessageSigningFormState } from "../types/app-state";

type SignMessagePanelProps = {
  title: string;
  submitLabel: string;
  result: string;
  value: MessageSigningFormState;
  onEncodingChange: (value: MessageSigningFormState["encoding"]) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
};

export function SignMessagePanel({
  title,
  submitLabel,
  result,
  value,
  onEncodingChange,
  onMessageChange,
  onSubmit,
}: SignMessagePanelProps) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      <label className="field">
        <span>消息</span>
        <textarea
          rows={4}
          value={value.message}
          onChange={(event) => onMessageChange(event.target.value)}
        />
      </label>
      <label className="field">
        <span>编码</span>
        <select
          value={value.encoding}
          onChange={(event) =>
            onEncodingChange(event.target.value as MessageSigningFormState["encoding"])
          }
        >
          <option value="utf8">utf8</option>
          <option value="hex">hex</option>
        </select>
      </label>
      <button className="button primary" onClick={onSubmit}>
        {submitLabel}
      </button>
      {result ? <pre className="result-box">{result}</pre> : null}
    </article>
  );
}
