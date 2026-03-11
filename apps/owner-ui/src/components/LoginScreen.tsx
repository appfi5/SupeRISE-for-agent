type LoginScreenProps = {
  isPending: boolean;
  loginPassword: string;
  message: string;
  onLoginPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginScreen({
  isPending,
  loginPassword,
  message,
  onLoginPasswordChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">SupeRISE Owner Mode</p>
        <h1>接管 Agent 信用钱包</h1>
        <p className="lede">
          该模式用于人类后置介入。Agent 不接触私钥，但可以自由使用服务端已暴露能力。
        </p>
      </section>
      <section className="panel auth-panel">
        <h2>Owner 登录</h2>
        <p className="hint">
          首次启动的默认凭证会写入本机通知文件。登录后请立即轮换。
        </p>
        <label className="field">
          <span>密码</span>
          <input
            type="password"
            value={loginPassword}
            onChange={(event) => onLoginPasswordChange(event.target.value)}
            placeholder="输入 Owner 密码"
          />
        </label>
        <button
          className="button primary"
          disabled={isPending || !loginPassword}
          onClick={onSubmit}
        >
          进入 Owner Mode
        </button>
        {message ? <p className="status">{message}</p> : null}
      </section>
    </main>
  );
}
