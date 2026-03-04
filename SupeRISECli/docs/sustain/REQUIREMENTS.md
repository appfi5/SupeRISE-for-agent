# Sustain Requirements Document

> Version: v4 (2026-03-04)
> Status: Updated - MCP architecture refactor
> Platform API docs: [API.md](./API.md)

## 1. Project Background

SupeRISE CLI (`rise`) is a tool running on OpenClaw agents, providing two independent capability domains:

- **Wallet** — General-purpose CKB transfer/config/address-book operations, no external platform dependency
- **Sustain** — Keep-alive monitoring system designed specifically for the `superise-market` platform

Sustain's core goal: **When an OpenClaw agent uses superise-market as its model provider, autonomously monitor balance consumption, predict depletion time, plan and execute keep-alive actions (model switching / top-up), ensuring uninterrupted agent service.**

### 1.1 Core Design Principles

**Agent autonomous keep-alive capability**:
1. Agent needs to know how to stay alive (via `rise sustain` commands and SKILL.md)
2. Agent needs self-feedback capability (receiving cron job reports via OpenClaw messaging)
3. Agent orchestrates business logic through CLI commands, not by calling underlying APIs directly

**Layered architecture principles**:
1. **MCP Tool Layer** - Pure market platform API mapping, zero business logic
2. **CLI Command Layer** - Complete business logic orchestration, including validation, strategy, state management
3. **Platform API Layer** - Underlying platform interface implementation

## 2. Prerequisites

Sustain functionality is only active when both of the following conditions are met:

| # | Prerequisite | Verification |
|---|-------------|--------------|
| 1 | Running in OpenClaw environment | `openclaw --version` succeeds |
| 2 | Using superise-market provider | `openclaw models status --json` returns model with `openrouter/` prefix |

When either condition is not met, all sustain commands, MCP tools, and cron jobs should not be triggered or suggested. Wallet functionality is unaffected.

## 3. superise-market Platform Overview

> Full API reference: [API.md](./API.md)

superise-market (SupeRISE Market) is an AI model proxy platform providing two sets of APIs:

- **Platform Management API** (`/api/v1/...`) — User/auth, API Key management, model catalog, quotation queries
- **OpenAI-Compatible API** (`/v1/...`) — Standard OpenAI protocol (chat/completions/embeddings/responses)

### 3.1 Billing Model

**Pay-per-use, no subscription/plan concept.**

- User accounts have a `balance` (`GET /api/v1/user/info` → `balance` field, in smallest currency unit)
- Each API call deducts from balance based on actual usage
- Service is interrupted when balance is depleted
- When balance is insufficient, a **top-up** is needed (not "renew")

### 3.2 Models and Suppliers

```
User/Agent → API Key → superise-market platform → multiple underlying suppliers (competing by quotation)
```

- **Model catalog**: `GET /api/v1/ai-models` (paginated, no auth required), each model has GUID `id`, `name`, `provider`, `version`, `scene`, `capability`
- **Quotation mechanism**: `POST /api/v1/ai-models/quotations` (paginated, query by modelId), each model has multiple merchant quotations
- **Supplier selection**: Determined automatically by the platform. Users influence selection by setting price ranges when creating API Keys
- **Two model identifier systems**:
  - Platform Management API: GUID (`1a2b3c4d-5e6f-...`)
  - OpenAI-Compatible API: short name (`gpt-4o`), which is also the format used by OpenClaw model refs

### 3.3 Authentication

| Scenario | Auth Method | How to Obtain |
|----------|------------|---------------|
| Platform Management API | JWT Bearer Token | `POST /api/v1/user/login-for-agent` → `accessToken` |
| OpenAI-Compatible API | API Key | `GET /api/v1/model-api-keys` → `apiKey` field |

### 3.4 Key Mappings to Sustain

| Platform Concept | Sustain Usage | API |
|-----------------|---------------|-----|
| `balance` (account balance) | Core input for keep-alive decisions (replaces former quota remaining) | `GET /api/v1/user/info` |
| `AiModelVo` (model list) | Model switch candidates | `GET /api/v1/ai-models` |
| `AiModelQuotationVo` (quotations) | Cost evaluation, selecting cheaper models | `POST /api/v1/ai-models/quotations` |
| OpenAI `/v1/models` | OpenClaw model ref mapping | `GET /v1/models` |

## 4. Functional Requirements

### 4.1 Authentication & Session (Auth)

**FR-AUTH-1**: Login using platform credentials to obtain JWT Token for subsequent management API calls

**FR-AUTH-2**: Token stored securely locally, with automatic re-authentication after expiry

**FR-AUTH-3**: Agent can autonomously register a platform account (during first-time setup)

### 4.2 Observe

**FR-OBS-1**: Query current balance status
- Obtain `balance` via `GET /api/v1/user/info`
- Use `balance` as the equivalent of "remaining" for threshold evaluation

**FR-OBS-2**: Query available platform model list
- Obtain model catalog via `GET /api/v1/ai-models`
- Attach quotation info for each model via `POST /api/v1/ai-models/quotations`
- Provide OpenClaw-side `openrouter/<model-short-name>` reference format (short name mapping via `/v1/models`)

**FR-OBS-3**: Query quotations across suppliers for the currently used model

### 4.3 Forecast

**FR-FORE-1**: Calculate consumption rate (burn rate, unit: smallest currency unit/minute) based on historical balance observations

**FR-FORE-2**: Predict remaining time until balance reaches critical/low thresholds (ETA)

**FR-FORE-3**: Provide confidence metrics based on observation data volume

### 4.4 Plan

**FR-PLAN-1**: Generate action plan based on forecast results and strategy
- Strategies: `availability` (prioritize uptime), `balanced`, `cost` (minimize spending)

**FR-PLAN-2**: Available actions:
- `noop` — Balance healthy, no action needed
- `switch_model` — Switch to a model with lower quotation to reduce burn rate
- `top_up` — Top up account balance
- `switch_then_top_up` — Switch model first, then top up

**FR-PLAN-3**: Guardrail mechanisms:
- Daily top-up count limit (`dailyTopUpLimit`)
- Auto top-up toggle (`autoTopUpEnabled`)
- Single top-up amount cap

### 4.5 Act

**FR-ACT-1**: Model switching is executed on the OpenClaw agent side via `openclaw models set openrouter/<model-short-name>`. Short names come from the `/v1/models` endpoint.

**FR-ACT-2**: Top-up is completed via CKB on-chain payment:
1. Calculate the required top-up amount
2. Build, sign, and send CKB transaction to the platform top-up address
3. Platform auto-detects the deposit and increases balance
> Note: Top-up is an **account-level** operation, not targeting a specific model.

**FR-ACT-3**: Score each execution (`scoreDecision`), dimensions: availability, cost, stability

### 4.6 Monitoring Loop (Tick)

**FR-TICK-1**: Single complete cycle: observe balance → forecast consumption → plan action → execute (optional) → score

**FR-TICK-2**: Support dry-run mode (observe and plan only, no execution)

**FR-TICK-3**: Scheduled via OpenClaw cron (default every 5 minutes)

### 4.7 Provider Lifecycle Management

**FR-LIFE-1**: Runtime guard — All side-effecting operations check if the current provider is `openrouter` before execution. If not, immediately return a skip result.

**FR-LIFE-2**: Cron job management — When provider switches away from superise-market, pause all `sustain-*` cron jobs; re-enable when switched back.

**FR-LIFE-3**: OpenClaw has no `/model` switch hook event, so lifecycle management relies on:
- Runtime guard (passive protection)
- Agent/user explicitly executing teardown/restore (active management)

### 4.8 MCP Tool Exposure

**FR-MCP-1**: Expose tools via stdio MCP server (tool names and count to be finalized during design phase, may differ from current v1):

| Tool (tentative) | Category | Read/Write | Changes |
|-------------------|----------|------------|---------|
| `sustain.balance.get_status` | Observe | Read | Renamed: quota → balance |
| `sustain.balance.get_pricing` | Observe | Read | Semantic change: shows model quotations instead of plan pricing |
| `sustain.forecast.compute` | Forecast | Read | Unchanged |
| `sustain.plan.generate` | Plan | Read | Action name change: renew → top_up |
| `sustain.supervision.tick` | Loop | Read/Write | Unchanged |
| `sustain.model.list_candidates` | Observe | Read | Output includes real quotations |
| `sustain.model.switch` | Act | Write | Unchanged |
| `sustain.billing.top_up` | Act | Write | Renamed: renew → top_up |
| `sustain.billing.confirm_payment` | Act | Write | TBD (depends on top-up flow) |

### 4.9 Local Storage

**FR-STORE-1**: SQLite persistence: balance observations, plan records, action records, score records, local policy, auth credentials

**FR-STORE-2**: Retain the most recent 500 observation records for burn rate calculation

## 5. Current Implementation Issues

### 5.1 Billing Model Error

**Current state**: The entire system assumes a plan-based subscription model (`renewSubscription`, `RemotePlanInfo`, `defaultPlan`, etc.)

**Reality**: The platform uses pay-per-use + account balance model. No plan/subscription/quota concept. The core metric is `balance` (account balance), not `remaining` (quota remaining).

**Impact scope**: `SuperiseOpenRouterClient` interface, `SustainPolicy`, `engine.ts` decision logic, `payment.ts`, all MCP tool descriptions

### 5.2 Inauthentic Model Data Source

**Current state**: `fetchModels()` returns hard-coded mock data (3 models, with fictional `burnRatePerMinute` and `rank` fields)

**Reality**: Platform API returns a completely different structure:
- No `burnRatePerMinute` (must be estimated from balance change observations)
- No `rank` (must be sorted based on quotation data)
- Has platform-specific fields like `scene`, `capability`
- Management API uses GUIDs to identify models, OpenAI-compatible API uses short names

### 5.3 Missing Quotation Data

**Current state**: No quotation-related logic whatsoever

**Reality**: Platform provides multi-supplier quotations per model. Quotations directly affect model switching decisions and cost evaluation.

### 5.4 Missing Authentication Layer

**Current state**: No authentication logic. Client is pure mock.

**Reality**: Platform Management API requires JWT Bearer Token (obtained via login); OpenAI-compatible API requires API Key. Sustain needs both auth mechanisms simultaneously.

### 5.5 Missing Model Identifier Mapping

**Current state**: Uses fictional short names (`gpt-5`) as model refs

**Reality**: Need to establish **platform GUID ↔ OpenAI short name** mapping. OpenClaw model ref uses `openrouter/<short-name>` format, where short-name comes from `/v1/models`.

## 6. Non-Functional Requirements

**NFR-1**: All sustain operations should not block the agent's main session

**NFR-2**: MCP server runs via stdio, does not occupy additional ports

**NFR-3**: Local data (SQLite) stored at `~/.rise/sustain/state.db`

**NFR-4**: All CLI commands support `--json` output format

**NFR-5**: Wallet functionality and Sustain functionality are fully decoupled and independent

**NFR-6**: Auth credentials stored securely, never written in plaintext to logs or MCP output
