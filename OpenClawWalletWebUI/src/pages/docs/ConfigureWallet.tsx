const ConfigureWallet = () => (
  <article className="prose prose-neutral max-w-none">
    <h1 className="text-2xl font-bold mb-4">Configure Wallet</h1>
    <p className="text-muted-foreground mb-6">
      Create and manage custodial wallets via the API.
    </p>

    <h2 className="text-xl font-semibold mt-8 mb-3">Create Wallet</h2>
    <p className="text-muted-foreground mb-4">
      Use the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /v1/wallets</code> endpoint to create a new wallet:
    </p>
    <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto mb-6">
      <code>{`curl -X POST https://api.openclawwallet.com/v1/wallets \\
  -H "Authorization: Bearer ocw_live_sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"chain": "ethereum"}'`}</code>
    </pre>

    <h2 className="text-xl font-semibold mt-8 mb-3">Supported Chains</h2>
    <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-6">
      <li>Ethereum (ETH)</li>
      <li>Polygon (MATIC)</li>
      <li>BNB Smart Chain (BSC)</li>
      <li>Solana (SOL)</li>
    </ul>

    <h2 className="text-xl font-semibold mt-8 mb-3">Query Wallets</h2>
    <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto mb-6">
      <code>{`curl https://api.openclawwallet.com/v1/wallets \\
  -H "Authorization: Bearer ocw_live_sk_your_key"`}</code>
    </pre>

    <h2 className="text-xl font-semibold mt-8 mb-3">Deposits</h2>
    <p className="text-muted-foreground">
      After creating a wallet, send assets to the wallet address to deposit. You can view the deposit address and QR code on the wallet details page in the console.
    </p>
  </article>
);

export default ConfigureWallet;
