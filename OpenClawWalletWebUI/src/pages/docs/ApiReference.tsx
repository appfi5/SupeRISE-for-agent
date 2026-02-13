const ApiReference = () => (
  <article className="prose prose-neutral max-w-none">
    <h1 className="text-2xl font-bold mb-4">API Reference</h1>
    <p className="text-muted-foreground mb-6">
      All API requests require an API Key in the Authorization header.
    </p>

    <h2 className="text-xl font-semibold mt-8 mb-3">Authentication</h2>
    <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto mb-6">
      <code>Authorization: Bearer ocw_live_sk_your_api_key</code>
    </pre>

    <h2 className="text-xl font-semibold mt-8 mb-3">Endpoints</h2>

    <div className="space-y-6">
      {[
        { method: "POST", path: "/v1/wallets", desc: "Create a new wallet" },
        { method: "GET", path: "/v1/wallets", desc: "List wallets" },
        { method: "GET", path: "/v1/wallets/:id", desc: "Get wallet details" },
        { method: "GET", path: "/v1/wallets/:id/transactions", desc: "Get transaction history" },
        { method: "POST", path: "/v1/wallets/:id/send", desc: "Send a transaction" },
        { method: "GET", path: "/v1/api-keys", desc: "List API Keys" },
        { method: "POST", path: "/v1/api-keys", desc: "Create API Key" },
        { method: "PATCH", path: "/v1/api-keys/:id", desc: "Update API Key status" },
        { method: "DELETE", path: "/v1/api-keys/:id", desc: "Delete API Key" },
        { method: "GET", path: "/v1/wallets/:id/rules", desc: "Get wallet rules" },
        { method: "PUT", path: "/v1/wallets/:id/rules", desc: "Set wallet rules" },
      ].map((api) => (
        <div key={api.path + api.method} className="flex items-start gap-3">
          <code className="shrink-0 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono font-semibold">
            {api.method}
          </code>
          <div>
            <code className="text-sm">{api.path}</code>
            <p className="text-sm text-muted-foreground mt-0.5">{api.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </article>
);

export default ApiReference;
