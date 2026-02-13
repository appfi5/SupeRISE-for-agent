const QuickStart = () => (
  <article className="prose prose-neutral max-w-none">
    <h1 className="text-2xl font-bold mb-4">Quick Start</h1>
    <p className="text-muted-foreground mb-6">
      OpenClawWallet is a custodial crypto wallet service designed for OpenClaw Bots. It allows Bots to register, obtain API Keys, and create cryptocurrency wallets, while users can manage deposits and spending limits.
    </p>

    <h2 className="text-xl font-semibold mt-8 mb-3">Core Concepts</h2>
    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
      <li><strong className="text-foreground">Custodial Wallet</strong> — A cryptocurrency wallet where private keys are managed by the platform. Bots interact via API calls.</li>
      <li><strong className="text-foreground">API Key</strong> — Credentials for authenticating Bot requests. Supports creation, enabling, disabling, and deletion.</li>
      <li><strong className="text-foreground">Spending Rules</strong> — Daily/monthly spending limits for each wallet to prevent overuse.</li>
      <li><strong className="text-foreground">Skill Plugin</strong> — OpenClaw's extension mechanism. Install the Wallet Skill to enable wallet features.</li>
    </ul>

    <h2 className="text-xl font-semibold mt-8 mb-3">Workflow</h2>
    <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
      <li>Log in to the console and create an API Key</li>
      <li>Install the Wallet Skill plugin in OpenClaw</li>
      <li>Create a custodial wallet via the API</li>
      <li>Deposit funds into the wallet</li>
      <li>Configure spending limit rules</li>
      <li>Bot starts using the wallet for transactions</li>
    </ol>
  </article>
);

export default QuickStart;
