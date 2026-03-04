/**
 * Test Server for SupeRISE Market Platform API + Sign Server
 *
 * Mimics ALL platform API endpoints and sign-server endpoints on a single port
 * for local CLI testing. Includes balance decay simulation for realistic
 * forecast/plan/act testing.
 *
 * Usage:
 *   bun run test-server
 *
 * Configure CLI to point here:
 *   rise sustain config set platformBaseUrl http://localhost:3939
 *   rise config set-sign-server-url http://localhost:3939
 *
 * Environment variables:
 *   TEST_SERVER_PORT      - Port number (default: 3939)
 *   TEST_INITIAL_BALANCE  - Starting balance (default: 10000)
 *   TEST_DECAY_RATE       - Balance decay per minute (default: 5)
 *
 * Limitation:
 *   `rise sustain top-up` calls `rise transfer` which performs a real CKB
 *   blockchain transaction. This cannot be fully simulated by the test server.
 *   Use `--dry-run` for top-up testing, or test up to the order creation step
 *   via the MCP tool `market.order.create`.
 */

const PORT = Number(process.env.TEST_SERVER_PORT || 3939);
const INITIAL_BALANCE = Number(process.env.TEST_INITIAL_BALANCE || 10000);
const DECAY_RATE = Number(process.env.TEST_DECAY_RATE || 5); // per minute

// ===== In-memory state =====

let balance = INITIAL_BALANCE;
let lastDecayTime = Date.now();
const JWT_TOKEN = "test-jwt-token-" + Date.now();
const API_KEY = "test-api-key-" + Date.now();
const WALLET_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwstest";
const WALLET_PUBLIC_KEY = "0x" + "cc".repeat(33);

const models = [
  { id: "m-001", name: "gpt-4o", provider: "OpenAI", version: "2024-08", scene: 1, capability: "chat" },
  { id: "m-002", name: "gpt-4o-mini", provider: "OpenAI", version: "2024-07", scene: 1, capability: "chat" },
  { id: "m-003", name: "claude-3.5-sonnet", provider: "Anthropic", version: "2024-10", scene: 1, capability: "chat" },
  { id: "m-004", name: "deepseek-chat", provider: "DeepSeek", version: "v3", scene: 1, capability: "chat" },
];

const quotations: Record<string, Array<{ id: string; merchantId: string; modelId: string; price: number }>> = {
  "m-001": [
    { id: "q-001", merchantId: "merchant-1", modelId: "m-001", price: 500 },
    { id: "q-002", merchantId: "merchant-2", modelId: "m-001", price: 450 },
  ],
  "m-002": [
    { id: "q-003", merchantId: "merchant-1", modelId: "m-002", price: 100 },
    { id: "q-004", merchantId: "merchant-2", modelId: "m-002", price: 80 },
  ],
  "m-003": [
    { id: "q-005", merchantId: "merchant-1", modelId: "m-003", price: 600 },
  ],
  "m-004": [
    { id: "q-006", merchantId: "merchant-1", modelId: "m-004", price: 30 },
    { id: "q-007", merchantId: "merchant-2", modelId: "m-004", price: 25 },
  ],
};

const apiKeys = [
  { id: "ak-001", name: "default", apiKey: API_KEY, isRevoked: false, createdAt: new Date().toISOString() },
];

let orderCounter = 0;
const orders: Map<string, { id: string; toAddress: string; amount: number; txHash?: string }> = new Map();

// ===== Balance Decay =====

function getDecayedBalance(): number {
  const now = Date.now();
  const minutesElapsed = (now - lastDecayTime) / (1000 * 60);
  const decayed = Math.max(0, balance - Math.floor(minutesElapsed * DECAY_RATE));
  return decayed;
}

function commitDecay(): void {
  balance = getDecayedBalance();
  lastDecayTime = Date.now();
}

// ===== Helpers =====

function ok<T>(data: T) {
  return Response.json({ success: true, message: "ok", code: 200, data, errorData: null });
}

function err(message: string, code = 400) {
  return Response.json({ success: false, message, code, data: null, errorData: null }, { status: code });
}

function paged<T>(items: T[], pageIndex: number, pageSize: number) {
  const start = (pageIndex - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { items: slice, total: items.length, pageIndex, pageSize };
}

function checkAuth(req: Request): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${JWT_TOKEN}` || auth === `Bearer ${API_KEY}`;
}

function log(method: string, path: string, extra?: string) {
  const ts = new Date().toISOString().slice(11, 19);
  const bal = getDecayedBalance();
  console.log(`[${ts}] ${method.padEnd(5)} ${path}${extra ? "  " + extra : ""}  (bal=${bal})`);
}

// ===== Server =====

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // ── Auth (Market Platform) ──

    if (path === "/api/v1/user/gen-sign-message" && method === "POST") {
      const body = await req.json() as { ckbAddress: string };
      log(method, path, `ckbAddress=${body.ckbAddress}`);
      if (!body.ckbAddress) return err("ckbAddress required");
      return ok(`Sign this message to authenticate: ${Date.now()}`);
    }

    if (path === "/api/v1/user/login-for-agent" && method === "POST") {
      const body = await req.json() as { ckbAddress: string; publicKey: string; originMessage: string; signature: string };
      log(method, path, `ckbAddress=${body.ckbAddress}`);
      return ok({
        accessToken: "Bearer " + JWT_TOKEN,
        refreshToken: "refresh-" + JWT_TOKEN,
        expiresIn: "86400",
        scope: "user",
      });
    }

    // ── User Info ──

    if (path === "/api/v1/user/info" && method === "GET") {
      if (!checkAuth(req)) return err("Unauthorized", 401);
      commitDecay();
      log(method, path);
      return ok({
        userId: "user-001",
        userName: "test-user",
        email: "test@example.com",
        ckbAddress: WALLET_ADDRESS,
        avatar: "",
        isEnabled: true,
        balance: String(balance),
      });
    }

    // ── API Keys ──

    if (path === "/api/v1/model-api-keys" && method === "GET") {
      if (!checkAuth(req)) return err("Unauthorized", 401);
      log(method, path);
      return ok(apiKeys);
    }

    // ── Models (Platform Management API) ──

    if (path === "/api/v1/ai-models" && method === "GET") {
      const pageIndex = Number(url.searchParams.get("pageIndex") || 1);
      const pageSize = Number(url.searchParams.get("pageSize") || 50);
      log(method, path, `page=${pageIndex}`);
      return ok(paged(models, pageIndex, pageSize));
    }

    if (path === "/api/v1/ai-models/quotations" && method === "POST") {
      const body = await req.json() as { modelId: string; pageIndex?: number; pageSize?: number };
      const modelQuotations = quotations[body.modelId] || [];
      const pageIndex = body.pageIndex || 1;
      const pageSize = body.pageSize || 50;
      log(method, path, `modelId=${body.modelId}`);
      return ok(paged(modelQuotations, pageIndex, pageSize));
    }

    // ── Models (OpenAI Compatible API) ──

    if (path === "/v1/models" && method === "GET") {
      if (!checkAuth(req)) return err("Unauthorized", 401);
      log(method, path);
      return Response.json({
        object: "list",
        data: models.map((m) => ({
          id: m.name,
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: m.provider.toLowerCase(),
        })),
      });
    }

    // ── Orders (Top-up) ──

    if (path === "/api/v1/order/create" && method === "POST") {
      if (!checkAuth(req)) return err("Unauthorized", 401);
      const body = await req.json() as { fromAddress: string; currencyType: number; amount: number };
      orderCounter++;
      const orderId = `order-${orderCounter}`;
      const toAddress = WALLET_ADDRESS;
      orders.set(orderId, { id: orderId, toAddress, amount: body.amount });
      log(method, path, `orderId=${orderId} amount=${body.amount}`);
      return ok({ id: orderId, toAddress, currencyType: body.currencyType, exchangeAmount: String(body.amount * 100) });
    }

    if (path === "/api/v1/order/submit-tx-hash" && method === "POST") {
      if (!checkAuth(req)) return err("Unauthorized", 401);
      const body = await req.json() as { orderId: string; txHash: string };
      const order = orders.get(body.orderId);
      if (!order) return err("Order not found");
      order.txHash = body.txHash;
      commitDecay();
      balance += order.amount * 100;
      log(method, path, `orderId=${body.orderId} credited=${order.amount * 100}`);
      return ok(true);
    }

    // ── Sign Server: Message Signing ──

    if (path === "/api/v1/agent/sign/sign-message" && method === "POST") {
      const body = await req.json() as { address: string; message: string };
      log(method, path, `address=${body.address.slice(0, 20)}...`);
      return ok({ address: body.address, signature: "0x" + "ab".repeat(65) });
    }

    // ── Sign Server: CKB Transaction Signing ──

    if (path === "/api/v1/agent/sign/sign-ckb-transaction" && method === "POST") {
      const body = await req.json() as { address: string; content: string };
      log(method, path, `address=${body.address.slice(0, 20)}...`);
      const mockTxHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      return ok({ address: body.address, content: body.content, txHash: mockTxHash });
    }

    // ── Sign Server: Wallet Info ──

    if (path === "/api/v1/agent/key-config/list" && method === "GET") {
      log(method, path);
      return ok([
        {
          addressType: 2,
          address: WALLET_ADDRESS,
          publicKey: WALLET_PUBLIC_KEY,
        },
      ]);
    }

    // ── Admin: Manual balance control (for testing) ──

    if (path === "/admin/set-balance" && method === "POST") {
      const body = await req.json() as { balance: number };
      balance = body.balance;
      lastDecayTime = Date.now();
      log(method, path, `newBalance=${balance}`);
      return ok({ balance });
    }

    if (path === "/admin/status" && method === "GET") {
      const currentBalance = getDecayedBalance();
      return Response.json({
        balance: currentBalance,
        rawBalance: balance,
        decayRate: DECAY_RATE,
        uptime: Math.floor((Date.now() - (server as any)._startTime) / 1000),
        orders: orderCounter,
        jwt: JWT_TOKEN,
        apiKey: API_KEY,
      });
    }

    // ── Fallback ──

    log(method, path, "→ 404");
    return new Response(`Not found: ${method} ${path}`, { status: 404 });
  },
});

(server as any)._startTime = Date.now();

console.log(`
┌──────────────────────────────────────────────────┐
│       SupeRISE Market Test Server                │
├──────────────────────────────────────────────────┤
│  URL:  http://localhost:${PORT}                      │
│                                                  │
│  Balance:    ${String(balance).padEnd(10)} (decay: ${DECAY_RATE}/min)     │
│  Models:     ${models.length} available                        │
│  Wallet:     ${WALLET_ADDRESS.slice(0, 30)}... │
│                                                  │
│  Configure CLI:                                  │
│    rise sustain config set platformBaseUrl \\     │
│      http://localhost:${PORT}                        │
│    rise config set-sign-server-url \\             │
│      http://localhost:${PORT}                        │
│                                                  │
│  Admin endpoints:                                │
│    POST /admin/set-balance  {"balance": 500}     │
│    GET  /admin/status                            │
│                                                  │
│  Testable flows:                                 │
│    ✅ rise sustain health-check                  │
│    ✅ rise sustain forecast                      │
│    ✅ rise sustain plan                          │
│    ✅ rise sustain list-models                   │
│    ✅ rise sustain tick                          │
│    ✅ rise sustain tick --execute (model switch)  │
│    ✅ rise sustain top-up <n> --dry-run          │
│    ✅ rise sustain setup                         │
│    ✅ rise sustain mcp-server                    │
│    ⚠️  rise sustain top-up <n> (needs real CKB)  │
│                                                  │
│  Tip: Use /admin/set-balance to force low/       │
│  critical balance for testing plan/act flows.    │
└──────────────────────────────────────────────────┘
`);
