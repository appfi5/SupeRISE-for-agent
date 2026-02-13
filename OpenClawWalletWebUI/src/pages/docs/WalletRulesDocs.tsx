const WalletRulesDocs = () => (
  <article className="prose prose-neutral max-w-none">
    <h1 className="text-2xl font-bold mb-4">Wallet Rules</h1>
    <p className="text-muted-foreground mb-6">
      Use spending limit rules to control each wallet's expenditure and prevent Bots from overspending.
    </p>

    <h2 className="text-xl font-semibold mt-8 mb-3">Rule Types</h2>
    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
      <li><strong className="text-foreground">Daily Limit</strong> — Maximum daily spending amount, resets at UTC 0:00.</li>
      <li><strong className="text-foreground">Monthly Limit</strong> — Maximum monthly spending amount, resets on the 1st of each month.</li>
    </ul>

    <h2 className="text-xl font-semibold mt-8 mb-3">Setting Rules</h2>
    <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto mb-6">
      <code>{`curl -X PUT https://api.openclawwallet.com/v1/wallets/:id/rules \\
  -H "Authorization: Bearer ocw_live_sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "daily_limit": 0.5,
    "monthly_limit": 10,
    "enabled": true
  }'`}</code>
    </pre>

    <h2 className="text-xl font-semibold mt-8 mb-3">Exceeding Limits</h2>
    <p className="text-muted-foreground">
      When a wallet's spending reaches its limit, subsequent transaction requests will return <code className="bg-muted px-1.5 py-0.5 rounded text-sm">429 Too Many Requests</code>,
      with remaining available quota information in the response. The Bot can adjust its behavior accordingly.
    </p>
  </article>
);

export default WalletRulesDocs;
