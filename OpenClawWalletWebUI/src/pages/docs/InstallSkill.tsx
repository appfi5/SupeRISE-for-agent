const InstallSkill = () => (
  <article className="prose prose-neutral max-w-none">
    <h1 className="text-2xl font-bold mb-4">Install Skill Plugin</h1>
    <p className="text-muted-foreground mb-6">
      To enable wallet features for your OpenClaw Bot, you need to install the Wallet Skill plugin.
    </p>

    <h2 className="text-xl font-semibold mt-8 mb-3">Step 1: Get the Skill Package</h2>
    <p className="text-muted-foreground mb-4">
      Search for <code className="bg-muted px-1.5 py-0.5 rounded text-sm">openclaw-wallet</code> in the OpenClaw Skill marketplace, or use the following command:
    </p>
    <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto mb-6">
      <code>openclaw skill install openclaw-wallet</code>
    </pre>

    <h2 className="text-xl font-semibold mt-8 mb-3">Step 2: Configure API Key</h2>
    <p className="text-muted-foreground mb-4">
      After installation, add your API Key to the Skill configuration file:
    </p>
    <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto mb-6">
      <code>{`# skill.config.yaml
wallet:
  api_key: "ocw_live_sk_your_api_key_here"
  base_url: "https://api.openclawwallet.com/v1"`}</code>
    </pre>

    <h2 className="text-xl font-semibold mt-8 mb-3">Step 3: Verify Installation</h2>
    <p className="text-muted-foreground mb-4">
      Run the following command to verify the Skill is properly installed:
    </p>
    <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto mb-6">
      <code>openclaw skill test wallet --ping</code>
    </pre>
    <p className="text-muted-foreground">
      If it returns <code className="bg-muted px-1.5 py-0.5 rounded text-sm">pong</code>, the setup is successful.
    </p>
  </article>
);

export default InstallSkill;
