import type { RotateCredentialFormState } from "../types/app-state";

type CredentialPanelProps = {
  value: RotateCredentialFormState;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function CredentialPanel({
  value,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onSubmit,
}: CredentialPanelProps) {
  return (
    <article className="panel">
      <h2>凭证轮换</h2>
      <label className="field">
        <span>当前密码</span>
        <input
          type="password"
          value={value.currentPassword}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
        />
      </label>
      <label className="field">
        <span>新密码</span>
        <input
          type="password"
          value={value.newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
        />
      </label>
      <button className="button primary" onClick={onSubmit}>
        更新凭证
      </button>
    </article>
  );
}
