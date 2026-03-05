# Sustain Design Document

> Prerequisite: [REQUIREMENTS.md](./REQUIREMENTS.md)
> Platform API: [API.md](./API.md)

## 1. Design Goals

Redesign the sustain data layer and decision layer based on the superise-market platform's actual API and **pay-per-use** billing model:

1. Use `balance` (account balance) instead of `quota remaining` as the core metric
2. Use **top-up** instead of **renew** — top-up is an account-level operation, not model-specific
3. Fetch model and pricing data from real platform APIs, replacing mocks
4. Drive model switching decisions based on pricing data
5. Add authentication layer (JWT Token + API Key)
6. Maintain layered architecture; MCP tool interface names may be slightly adjusted

## 2. Architecture Overview

### 2.1 Architecture (v4 - 2026-03-04)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Agent (OpenClaw)                         │
│              Learns how to stay alive via SKILL.md               │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              CLI Commands (Business Logic Layer)                  │
│  rise sustain health-check | forecast | plan | act | tick       │
│  rise sustain top-up | setup | config | ...                     │
│                                                                  │
│  Contains: validation, strategy, orchestration, state mgmt       │
├──────────────┬──────────────────┬──────────────────────────────┤
│  MCP Tools   │  Sustain Engine  │  Local Storage               │
│  (pure API   │  (core algorithm)│  (SQLite)                    │
│   mapping)   │                  │                              │
├──────────────┼──────────────────┼──────────────────────────────┤
│ market.*     │ healthCheck()    │ ~/.rise/sustain/state.db     │
│ (zero biz    │ forecast()       │ - observations               │
│  logic)      │ plan()           │ - plans                      │
│              │ act()            │ - actions                    │
│              │ score()          │ - scores                     │
│              │                  │ - kv (policy/config)         │
├──────────────┼──────────────────┼──────────────────────────────┤
│ Platform API │ OpenClaw CLI     │ CKB Transfer                 │
│ Client       │ (model switch)   │ (rise transfer)              │
│ + Auth       │ (provider guard) │                              │
│ + Mock       │ (cron lifecycle) │                              │
└──────────────┴──────────────────┴──────────────────────────────┘
```

### 2.2 MCP Tool Design Principles

**MCP tools are pure Platform API mappings**:
- ✅ Zero business logic (no validation, no strategy, no orchestration)
- ✅ 1:1 mapping to market platform API
- ✅ Transparent to the Agent (Agent does not call them directly)
- ✅ Follows industry standards (see Anthropic official MCP tools)

**MCP tool list**:
```
market.user.get_info       → GET /api/v1/user/info
market.user.get_balance    → GET /api/v1/user/info
market.models.list         → GET /api/v1/ai-models
market.models.get_pricing  → POST /api/v1/ai-models/quotations
market.models.list_openai  → GET /v1/models
market.order.create        → POST /api/v1/order/create
```

**NOT in MCP tools**:
- ❌ Health status calculation (healthy/low/critical)
- ❌ Burn rate forecasting (burnRate, etaCritical)
- ❌ Decision planning (plan.action, plan.reason)
- ❌ Policy validation (singleTopUpMaxCKB, dailyTopUpLimit)
- ❌ Counter updates (dailyTopUpCount++)
- ❌ OODA loop orchestration
- ❌ Top-up flow orchestration

### 2.3 CLI Command Business Logic Layer

**All business logic resides in `rise sustain` commands**:

```bash
rise sustain health-check
  → market.user.get_info()
  → Calculate health status (apply thresholds)
  → Return full report

rise sustain forecast
  → Query historical observations from database
  → Calculate burn rate and ETA
  → Return forecast result

rise sustain plan
  → health-check + forecast
  → Load policy configuration
  → Decide action type
  → Save plan to database

rise sustain top-up <amount>
  → Validate amount ≤ singleTopUpMaxCKB
  → Check dailyTopUpCount < dailyTopUpLimit
  → market.order.create()
  → rise transfer --to <toAddress>
  → market.order.submit_tx()
  → Update dailyTopUpCount++

rise sustain tick --execute
  → Full OODA loop
  → observe → forecast → plan → act → score
```

### 2.4 Industry MCP Tool Design Reference

Mainstream MCP tools are **pure API mapping layers** without business logic:

**Filesystem MCP** (Anthropic official):
```typescript
read_file(path)      → fs.readFile()
write_file(path)     → fs.writeFile()
list_directory(path) → fs.readdir()
```

**GitHub MCP** (Anthropic official):
```typescript
create_issue(repo, title, body)  → POST /repos/{owner}/{repo}/issues
list_issues(repo)                → GET /repos/{owner}/{repo}/issues
```

**Brave Search MCP**:
```typescript
brave_web_search(query)  → GET /search?q={query}
```

**Conclusion**: Business logic is the caller's responsibility (Agent or application layer); MCP tools only do API mapping.

### 2.5 Local Testing

The project does not use mocks or build-time mode switching. Testing is done via local test server + config switching:

```bash
# Start test server (simulates Platform API + Sign Server)
bun run test-server

# Point CLI to test server
rise sustain config set platformBaseUrl http://localhost:3939

# Restore production config
rise sustain config set platformBaseUrl https://superise-market.superise.net
```

Cron mode can be switched to `dev` (shorter intervals) via config:
```bash
rise sustain config set cronMode dev
```

## 3. Platform Data Model

### 3.1 Platform API to Sustain Method Mapping

```
Platform API                              → Sustain Method                    Auth
─────────────────────────────────────────────────────────────────────────────────
POST /api/v1/user/login                   → auth.login()                     None
POST /api/v1/user/info                    → client.fetchBalance()            JWT
GET  /api/v1/ai-models                    → client.fetchModels()             None
POST /api/v1/ai-models/quotations        → client.fetchModelQuotations()    None
GET  /v1/models                           → client.fetchOpenAIModels()       API Key
POST /api/v1/order/create                 → client.topUp() [step 1]         JWT
POST /api/v1/order/submit-tx-hash        → client.topUp() [step 3]         JWT
```

**Top-up flow** (orchestrated internally by `client.topUp()`):
1. `POST /api/v1/order/create` - Create order, get toAddress
2. `rise transfer --to <toAddress>` - Execute CKB transfer
3. `POST /api/v1/order/submit-tx-hash` - Submit `orderId + txHash`
```

### 3.2 Type Definitions

```typescript
// ===== Platform raw types (1:1 mapping with API responses) =====

export type PlatformResponse<T> = {
  data: T;
  success: boolean;
  message: string;
  code: number;
  errorData: unknown[] | null;
};

export type PlatformPagedData<T> = {
  items: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
};

export type PlatformTokenVo = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;        // seconds (string)
  scope: string;
};

export type PlatformUserInfoVo = {
  userId: string;           // GUID
  userName: string;
  email: string;
  ckbAddress: string;       // associated CKB address
  avatar: string;
  isEnabled: boolean;
  balance: string;          // account balance (string, USD, e.g. "12.34")
};

export type PlatformAiModel = {
  id: string;               // GUID
  name: string;             // e.g. "GPT-4o"
  provider: string;         // e.g. "OpenAI"
  version: string;
  scene: number;            // scene enum
  capability: string;
};

export type PlatformModelQuotation = {
  id: string;               // GUID (quotation ID)
  merchantId: string;       // GUID (merchant ID)
  modelId: string;          // GUID (model ID)
  price: number;            // quotation (long, smallest currency unit)
};

export type PlatformModelApiKeyVo = {
  id: string;               // GUID
  name: string;
  apiKey: string;           // sk-...
  isRevoked: boolean;
  createdAt: string;        // ISO 8601
};

/** Single model from OpenAI-compatible /v1/models response */
export type OpenAIModelEntry = {
  id: string;               // short name e.g. "gpt-4o"
  object: string;           // "model"
  created: number;
  owned_by: string;
};

// ===== Sustain internal derived types =====

/** Model with pricing + short name (used by engine) */
export type ModelWithPricing = {
  platformId: string;       // platform GUID
  shortName: string;        // OpenAI-compatible short name (from /v1/models)
  displayName: string;      // platform name
  provider: string;
  version: string;
  scene: number;
  capability: string;
  minPrice: number;         // lowest quotation
  maxPrice: number;         // highest quotation
  avgPrice: number;         // average quotation
  quotationCount: number;   // number of quotation suppliers
};

/** Balance status (replaces former RemoteQuotaStatus) */
export type BalanceStatus = {
  balance: number;          // account balance
  userName: string;
  email: string;
  observedAt: string;       // ISO 8601
};
```

### 3.3 Type Migration Reference

| Old Type | New Type | Changes |
|----------|----------|---------|
| `RemoteQuotaStatus { remaining, total, currentModel, subscriptionExpiry }` | `BalanceStatus { balance, userName, email }` | Removed total/currentModel/expiry; core metric changed to balance |
| `RemoteModelInfo { id, burnRatePerMinute, rank }` | `ModelWithPricing { platformId, shortName, ..., minPrice, avgPrice }` | Removed fictional fields; added real platform data + short name mapping |
| `RemotePricing { plans: Record<string, RemotePlanInfo> }` | **Removed** | No subscription/plan concept |
| `RemotePlanInfo { quota, cost, currency, duration }` | **Removed** | Same as above |
| `RemoteRenewResult` | Redefined as `TopUpResult` | renew → top_up |
| `RemoteConfirmPaymentResult` | TBD (depends on top-up flow) | |
| N/A | `PlatformTokenVo` / `PlatformUserInfoVo` / ... | New platform types |

## 4. Authentication Layer Design

### 4.1 New Module: `src/services/platform-auth.ts`

```typescript
export type AuthCredentials = {
  email: string;
  password: string;          // encrypted storage
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;         // Unix timestamp ms
  apiKey: string;            // cached API Key
};

export interface PlatformAuthService {
  /** Login to get JWT; returns existing session if still valid */
  ensureSession(): Promise<AuthSession>;

  /** Get or create an API Key for OpenAI-compatible API */
  ensureApiKey(): Promise<string>;

  /** Register new account */
  register(email: string, password: string): Promise<AuthSession>;

  /** Clear local credentials */
  logout(): void;
}
```

### 4.2 Credential Storage

- Credentials stored in SQLite `kv` table (key = `auth_session`), same table as `policy`
- `password` stored using OS keychain or symmetric encryption (never plaintext in DB)
- Token auto-refreshes/re-authenticates 5 minutes before expiry

### 4.3 Authentication Flow

```
First-time authentication:
  1. GET /api/v1/agent/key-config/list → Get wallet address + public key
  2. POST /api/v1/user/gen-sign-message → Get message to sign
  3. POST /api/v1/agent/sign/sign-message → Sign the message
  4. POST /api/v1/user/login-for-agent → Get accessToken
  5. GET /api/v1/model-api-keys → Get existing API Key
     └─ If none → POST /api/v1/model-api-keys/create → Create one
  6. Store session to ~/.rise/market-session.json

Subsequent calls:
  1. ensureToken() → Token expired?
     ├─ Not expired → Use directly
     └─ Expired → Re-execute auth flow → Update storage
  2. Platform management API: Authorization: Bearer <accessToken>
  3. OpenAI-compatible API: Authorization: Bearer <api_key>
```

## 5. Client Layer Design

### 5.1 Interface Redefinition

```typescript
export interface SuperiseOpenRouterClient {
  // ---- Balance ----
  /** Query account balance (POST /api/v1/user/info → balance) */
  fetchBalance(): Promise<BalanceStatus>;

  // ---- Models ----
  /** Get platform model list + pricing (GET /api/v1/ai-models + quotations) */
  fetchModels(): Promise<ModelWithPricing[]>;

  /** Get OpenAI-compatible model short name list (GET /v1/models) */
  fetchOpenAIModels(): Promise<OpenAIModelEntry[]>;

  // ---- Top-up ----
  /** Top up account balance */
  topUp(amountCKB: number, dryRun: boolean): Promise<TopUpResult>;
}
```

### 5.2 Implementation Strategy

```typescript
export function getOpenRouterClient(): SuperiseOpenRouterClient {
  const mode = process.env.SUSTAIN_CLIENT_MODE ?? "hybrid";
  switch (mode) {
    case "real":   return createRealClient();    // fully real
    case "mock":   return createMockClient();    // fully mock
    case "hybrid": return createHybridClient();  // confirmed real, unconfirmed mock
    default:       return createHybridClient();
  }
}
```

**Hybrid mode** (recommended initial mode):

| Method | Implementation | API |
|--------|---------------|-----|
| `fetchBalance()` | **Real** | `POST /api/v1/user/info` (JWT) |
| `fetchModels()` | **Real** | `GET /api/v1/ai-models` + `POST /api/v1/ai-models/quotations` |
| `fetchOpenAIModels()` | **Real** | `GET /v1/models` (API Key) |
| `topUp()` | **Mock** | API TBD |

### 5.3 Model Data Fetch Flow

```typescript
async fetchModels(): Promise<ModelWithPricing[]> {
  // 1. Paginate through all platform models
  const allModels = await this.fetchAllPages<PlatformAiModel>(
    "/api/v1/ai-models"
  );

  // 2. Fetch OpenAI-compatible short names (for name → shortName mapping)
  const openaiModels = await this.fetchOpenAIModels();
  const shortNameMap = buildNameToShortNameMap(allModels, openaiModels);

  // 3. Concurrently fetch quotations for each model
  const modelsWithPricing = await Promise.all(
    allModels.map(async (model) => {
      const quotations = await this.fetchModelQuotations(model.id);
      const prices = quotations.map((q) => q.price);
      return {
        platformId: model.id,
        shortName: shortNameMap.get(model.id) ?? model.name.toLowerCase(),
        displayName: model.name,
        provider: model.provider,
        version: model.version,
        scene: model.scene,
        capability: model.capability,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        avgPrice: prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0,
        quotationCount: quotations.length,
      };
    })
  );

  return modelsWithPricing;
}
```

### 5.4 Model Identifier Mapping

**Key design**: The platform uses GUIDs, OpenClaw uses `openrouter/<short-name>`. A mapping must be established.

```typescript
/**
 * Build platform GUID → OpenAI short name mapping.
 *
 * Strategy: fuzzy match by name.
 * Platform name="GPT-4o", OpenAI id="gpt-4o" → case-insensitive match.
 */
function buildNameToShortNameMap(
  platformModels: PlatformAiModel[],
  openaiModels: OpenAIModelEntry[],
): Map<string, string> {
  const map = new Map<string, string>();
  const openaiByLower = new Map(
    openaiModels.map((m) => [m.id.toLowerCase(), m.id])
  );

  for (const pm of platformModels) {
    // Exact match (case-insensitive)
    const exact = openaiByLower.get(pm.name.toLowerCase());
    if (exact) {
      map.set(pm.id, exact);
    }
    // If no match, shortName falls back to name.toLowerCase()
  }

  return map;
}
```

OpenClaw model ref format: `openrouter/<shortName>`, e.g. `openrouter/gpt-4o`

### 5.5 Caching Strategy

```typescript
// Model list + pricing: TTL 30 min (data changes infrequently)
// OpenAI model short names: TTL 60 min (almost never changes)
// Balance: no cache (queried in real-time every time; core decision input)
```

## 6. Engine Layer Design Changes

### 6.1 Terminology Renames

| Old | New | Notes |
|-----|-----|-------|
| `remaining` | `balance` | Core metric in observations and forecasts |
| `total` | Removed | No "total" concept in pay-per-use billing |
| `renew` | `top_up` | Action name |
| `switch_then_renew` | `switch_then_top_up` | Action name |
| `autoRenewEnabled` | `autoTopUpEnabled` | Policy field |
| `dailyRenewLimit/Count` | `dailyTopUpLimit/Count` | Policy field |
| `defaultPlan` | Removed | No plan/subscription concept |
| `subscriptionExpiry` | Removed | No subscription expiry concept |

### 6.2 SustainActionType Changes

```typescript
export type SustainActionType =
  | "noop"
  | "switch_model"
  | "top_up"               // was: "renew"
  | "switch_then_top_up";  // was: "switch_then_renew"
```

### 6.3 SustainPolicy Changes

```typescript
export type SustainPolicy = {
  strategy: SustainStrategy;
  autoTopUpEnabled: boolean;        // was: autoRenewEnabled
  topUpAmountDefault: number;       // default top-up amount (CKB) (replaces defaultPlan)
  thresholds: Thresholds;           // critical / low (unit: balance smallest currency unit)
  budget: {
    dailyTopUpLimit: number;        // was: dailyRenewLimit
    dailyTopUpCount: number;        // was: dailyRenewCount
    singleTopUpMaxCKB: number;      // new: single top-up cap
    renewCounterDate: string;
  };
};
```

### 6.4 Model Selection Logic Rewrite

```typescript
function selectCheaperModel(
  models: ModelWithPricing[],
  currentShortName: string,
): ModelWithPricing | null {
  const current = models.find((m) => m.shortName === currentShortName);
  if (!current) return null;

  // Select model with lower minPrice, smallest drop (gradual downgrade)
  const candidates = models
    .filter((m) => m.shortName !== currentShortName && m.minPrice < current.minPrice)
    .sort((a, b) => b.minPrice - a.minPrice);

  return candidates[0] ?? null;
}
```

### 6.5 healthCheck Changes

```typescript
export async function healthCheck(): Promise<Record<string, unknown>> {
  const client = getOpenRouterClient();
  const balanceStatus = await client.fetchBalance();
  const policy = loadLocalPolicy();

  appendObservation({
    ts: new Date().toISOString(),
    remaining: balanceStatus.balance,   // observations table reuses remaining column for balance
  });

  const status = classifyStatus(
    balanceStatus.balance,
    policy.thresholds.critical,
    policy.thresholds.low,
  );

  return {
    status,
    balance: balanceStatus.balance,
    userName: balanceStatus.userName,
    thresholds: policy.thresholds,
    observedAt: new Date().toISOString(),
  };
}
```

### 6.6 Burn Rate Calculation

Unchanged: still based on weighted moving average of `remaining` (now stores balance) in `observations` table.

Fallback adjustment (insufficient observation data):

```typescript
function estimateBurnRateFromPricing(
  models: ModelWithPricing[],
  currentShortName: string,
): number {
  const model = models.find((m) => m.shortName === currentShortName);
  if (!model) return 1;  // most conservative fallback
  // avgPrice ≈ cost per call; assume agent ~1 call/min
  return model.avgPrice;
}
```

### 6.7 listModelCandidates Output

```typescript
{
  candidates: [
    {
      model: "gpt-4o",                  // shortName
      modelRef: "openrouter/gpt-4o",    // OpenClaw model ref
      displayName: "GPT-4o",
      provider: "OpenAI",
      minPrice: 100,
      avgPrice: 110,
      quotationCount: 3,
    }
  ],
  currentModel: "gpt-4o",
  currentModelRef: "openrouter/gpt-4o",
  observedAt: "..."
}
```

## 7. Decision Flow

### 7.1 Strategy Matrix

```
Balance healthy (healthy, balance > low threshold)
  → noop

Balance low (low, etaCritical ≤ 720 min)
  → switch_model: select model with lower minPrice
  → Goal: reduce burn rate, extend balance runway

Balance critical (critical, etaCritical ≤ 120 min)
  → strategy=cost:         switch_model (select cheapest model)
  → strategy=balanced:     switch_then_top_up
  → strategy=availability: top_up

Top-up logic:
  → Top-up amount = policy.topUpAmountDefault (CKB)
  → Top-up is an account-level operation, not model-specific
  → After top-up, balance increases and benefits all models
```

### 7.2 Scoring Adjustments

```typescript
// cost dimension based on real price changes
let cost = 0;
if (params.action === "top_up" || params.action === "switch_then_top_up") {
  cost = -0.6;  // spent money
} else if (params.action === "switch_model") {
  // calculate savings ratio from price difference
  const saved = (beforePrice - afterPrice) / beforePrice;
  cost = Math.min(0.5, saved);
}
```

## 8. Data Flow

### 8.1 Full Tick Cycle

```
1. Provider Guard
   └─ openclaw models status --json → provider == "openrouter"?
   └─ No → skip

2. Auth
   └─ ensureSession() → ensure JWT is valid

3. Observe
   └─ POST /api/v1/user/info → get balance
   └─ appendObservation({ remaining: balance })

4. Forecast
   └─ observations table → calculate burn rate (balance change rate)
   └─ fallback: fetchModels() → estimate via avgPrice
   └─ calculate etaCritical, etaZero

5. Plan
   └─ forecast + strategy + guardrails → select action
   └─ switch_model: fetchModels() → selectCheaperModel()
   └─ appendPlan()

6. Act (if execute=true)
   └─ switch_model → openclaw models set openrouter/<shortName>
   └─ top_up → CKB transfer to platform top-up address
   └─ appendAction() + appendScore()
```

### 8.2 Cache Hit Path

```
fetchModels()
  ├─ Cache valid (< 30 min) → return directly
  └─ Cache expired
       ├─ GET /api/v1/ai-models (paginated, full list)
       ├─ GET /v1/models (short name mapping)
       ├─ per model: POST /api/v1/ai-models/quotations
       └─ Merge into ModelWithPricing[] → write to cache
```

## 9. Configuration

### 9.1 Environment Variables

```bash
# Platform API
SUPERISE_OPENROUTER_BASE_URL=https://api.superise-market.com

# Client mode
SUSTAIN_CLIENT_MODE=hybrid   # real | mock | hybrid

# Cache
SUSTAIN_MODELS_CACHE_TTL_MS=1800000    # 30 min
```

### 9.2 Local Policy (SustainPolicy)

```typescript
{
  strategy: "balanced",
  autoTopUpEnabled: true,
  topUpAmountDefault: 100,    // default top-up 100 CKB
  thresholds: { critical: 500, low: 2000 },
  budget: {
    dailyTopUpLimit: 3,
    dailyTopUpCount: 0,
    singleTopUpMaxCKB: 500,
    renewCounterDate: "..."
  }
}
```

### 9.3 Auth Credentials

```typescript
// Stored in SQLite kv table, key = "auth_credentials" / "auth_session"
// password encrypted at rest
// accessToken has expiry, auto-refreshed
```

## 10. File Change List

| File | Action | Description |
|------|--------|-------------|
| `src/services/platform-auth.ts` | **New** | Auth layer: login/register/session management |
| `src/services/platform-types.ts` | **New** | Platform API type definitions (Platform* types) |
| `src/services/superise-market.ts` | **Rewrite** | New interface (fetchBalance/fetchModels/topUp), real/hybrid/mock implementations |
| `src/core/sustain/types.ts` | **Modify** | `SustainActionType` changes (renew→top_up); add `BalanceStatus`/`ModelWithPricing` |
| `src/core/sustain/defaults.ts` | **Modify** | Default policy field renames |
| `src/core/sustain/engine.ts` | **Modify** | healthCheck uses balance; selectCheaperModel based on price; renew→top_up in act/plan |
| `src/core/sustain/payment.ts` | **Modify** | renew orchestration → top_up orchestration; remove plan parameter |
| `src/storage/sqlite-store.ts` | **Modify** | Add auth-related kv operations |
| `src/mcp-server/tools/quota.ts` | **Rename+Modify** | → `balance.ts`; tool name quota→balance |
| `src/mcp-server/tools/execution.ts` | **Modify** | renew → top_up tool |
| `src/mcp-server/tools/index.ts` | **Modify** | Update tool name list |
| `skills/superise-cli/SKILL.md` | **Update** | Reflect new terminology and tool names |
| `skills/superise-cli/references/SUSTAIN.md` | **Update** | Reflect new data flow and APIs |

**No changes needed**:
- `src/services/openclaw-cli.ts` — provider guard and cron management unchanged
- `src/mcp-server/index.ts` — MCP server startup unchanged
- `src/mcp-server/tools/planning.ts` — interface unchanged (action names output by engine layer)

## 11. Implementation Phases

### Phase 1: Auth + Balance + Models (can start immediately)

1. Add `platform-types.ts` (platform API types)
2. Add `platform-auth.ts` (login/session/API Key management)
3. Implement real `fetchBalance()` (`POST /api/v1/user/info` → balance)
4. Implement real `fetchModels()` (`GET /api/v1/ai-models` + quotations + `/v1/models` mapping)
5. Rewrite `selectCheaperModel` based on price
6. Adjust `SustainActionType` (renew → top_up) and `SustainPolicy`
7. Adjust engine.ts healthCheck/forecast/plan to use balance
8. Update MCP tool names (quota → balance)
9. Hybrid client: balance+models real, topUp still mock

### Phase 2: Top-up Flow (after top-up API confirmed)

1. Implement real `topUp()`
2. Adjust payment.ts (remove plan/order concept, use direct transfer top-up)
3. Complete `sustain.billing.top_up` MCP tool
4. Switch to real client mode

### Phase 3: Optimization

1. Use real pricing for scoring cost dimension
2. Price trend analysis
3. Usage detail API integration (if platform opens it)

## 12. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Model GUID ↔ short name mapping instability | Model switch failures | Validate mapping in Phase 1; fall back to name.toLowerCase() |
| Quotation requests N+1 (one per model) | High request volume | Concurrency + 30min cache |
| JWT expiry undetected | API calls return 401 | ensureSession() auto-checks + re-authenticates |
| Top-up API unknown | top_up action unavailable | Use mock in Phase 1; other features work in hybrid mode |
| Balance unit vs price unit mismatch | Burn rate calculation errors | Add unit conversion layer after confirmation |

## 13. Open Questions

See [REQUIREMENTS.md §6](./REQUIREMENTS.md).

---

> **Review checklist**:
> 1. Are the §3.2 type definitions accurately mapped to platform API?
> 2. Is the §5.4 model identifier mapping strategy (GUID ↔ short name fuzzy match) reliable?
> 3. Is the §6 balance-driven decision logic reasonable?
> 4. Is the position of the Auth step in the §7.1 Tick cycle appropriate?
> 5. Is the §11 phased plan feasible?
