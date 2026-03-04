---
name: superise-cli
description: Self-sustaining AI agent operations on SupeRISE platform - setup, initialize, monitor balance, forecast consumption, plan actions, switch models, and maintain continuous availability. Use when user wants to setup/enable/configure sustain system, manage operational balance, model costs, or ensure agent survival on superise-market platform.
user-invocable: true
disable-model-invocation: false
metadata: {"openclaw": {"emoji": "🔋", "requires": {"bins": ["rise"], "env": [], "config": []}, "install": "bun install && bun run build:bin && bun link"}}
---

# SupeRISE CLI - Self-Sustaining Agent Operations

Autonomous supervision system for AI agents running on the SupeRISE platform (superise-market). Enables self-monitoring, forecasting, planning, and execution to maintain continuous operation.

## When to Use This Skill

Use this skill when you need to:
- Monitor your operational balance and health status
- Forecast when resources will run out
- Switch to cheaper models to extend runway
- Top up balance to maintain availability
- Execute CKB blockchain transfers
- Manage address book for frequent recipients

**Keywords**: setup, initialize, configure, enable, install, balance, sustain, forecast, model switch, top-up, survival, CKB transfer, blockchain, wallet, credits, runway, burn rate, self-preservation, autonomy, budget, cost optimization

## Natural Language Triggers

This skill activates when the user expresses intent related to the categories below. Each category maps to a specific command.

### Setup & Initialization → `rise sustain setup`
- "Setup sustain", "Initialize self-preservation", "Enable autonomous operation"
- "Configure survival mode", "Install sustain system", "Make yourself self-sufficient"

### Balance & Health Check → `rise sustain health-check`
- "Check your balance", "How much credit do you have left?"
- "Are you running out of money?", "What's your runway?"
- "Will you survive until tomorrow?", "Are you still alive?"

### Forecasting → `rise sustain forecast`
- "When will you run out of money?", "How long can you keep running?"
- "Calculate your burn rate", "What's your ETA to critical?"
- "How many days till you're broke?"

### Cost Optimization → `rise sustain list-models` + `rise sustain tick --execute`
- "Switch to a cheaper model", "Reduce your operating costs"
- "Find a more affordable option", "Optimize your spending"

### Balance Top-up → `rise sustain top-up <amount>`
- "Top up your balance", "Recharge your account"
- "You need more runway", "You're running on empty"

### Full Supervision Cycle → `rise sustain tick --execute`
- "Run a self-check", "Execute survival protocol"
- "Keep yourself alive", "Auto-manage your resources"

### CKB Transfers → `rise transfer --to <addr> --amount <n>`
- "Send CKB to alice", "Transfer 100 CKB", "Pay someone"

## Prerequisites

### Platform Requirements
- **RISE CLI**: Compiled binary installed and available in PATH
  - Build with: `bun run build:bin` (compiles to native binary)
  - Install with: `bun link` (makes `rise` command available globally)
  - **Note**: Sustain requires compiled binary (not JS bundle) due to SQLite database

### Verification
```bash
# Verify rise CLI
rise --version

# Verify sustain setup
rise sustain health-check
```

## Agent Initialization Checklist

### Step 1: Initialize Database & Auth

```bash
rise sustain setup
```

This handles database creation, authentication with SupeRISE Market, and policy configuration.

### Step 2: Register Cron Jobs (Agent Does This Directly)

**Why the agent should register cron jobs itself**: When the agent runs `openclaw cron add` with `--session main`, the cron jobs are bound to the **main session**. Each time a cron fires, OpenClaw sends the `--message` to the agent. The agent then **autonomously evaluates the situation and acts** — top-up, switch model, or do nothing — **without asking the user for permission**. The `--announce` flag delivers the agent's summary to the user's chat as a secondary report.

**The core purpose of these cron jobs is autonomous decision-making, not just reporting.**

If cron jobs are registered by `rise sustain setup` (a subprocess), they may not bind to the correct session.

**Register the cron jobs directly:**

```bash
# Remove any existing sustain cron jobs first
openclaw cron rm sustain-tick 2>/dev/null
openclaw cron rm sustain-retry-orders 2>/dev/null

# Core keep-alive loop — agent autonomously evaluates and acts
openclaw cron add \
  --name sustain-tick \
  --every 5m \
  --session main \
  --message "You are an autonomous agent. Execute a keep-alive self-check now. 1. Run \`rise sustain tick --execute --json\`. 2. Evaluate the tick result: if balance is healthy, do nothing; if low, run \`rise sustain list-models --json\` to analyze market model pricing, compare costs, and decide whether switching to a cheaper model would meaningfully reduce burn rate — only switch if the savings justify it; if critical, top up or switch first then top up. 3. If topping up, decide the amount yourself (1000–20000 CKB) based on burn rate and balance — see the Top-Up Amount Decision Guide in your skill. Do NOT always use the minimum. 4. Execute \`rise sustain top-up <amount>\` or switch models without asking the user. 5. After acting, briefly announce your status and actions taken. If everything is normal, no need to bother the user." \
  --announce \
  --description "Sustain keep-alive: autonomous observe → decide → act → report"

# Order retry — automatic, only escalate failures to user
openclaw cron add \
  --name sustain-retry-orders \
  --every 10m \
  --session main \
  --message "Run \`rise sustain retry-orders --json\` to check for pending top-up orders. If no pending orders, do not bother the user. If any orders escalated to manual review (manual_review), report full details to the user (orderId, txHash, amount) for manual intervention." \
  --announce \
  --description "Retry pending top-up orders, escalate failures to user"
```

**Key flags explained:**
- `--every 5m` — run interval (duration format: `1m`, `5m`, `10m`, `1h`)
- `--session main` — deliver the message to the agent in the main session
- `--message "..."` — the instruction the agent receives; agent **autonomously decides and acts** based on this
- `--announce` — agent's summary is delivered to the user's chat (secondary, for awareness)

**Verify registration:**
```bash
openclaw cron list
```

**Fallback**: If `openclaw cron add` fails, `rise sustain setup` includes built-in cron registration as a backup:
```bash
rise sustain setup
```

### Step 3: Verify Health

```bash
rise sustain health-check
```

### Step 4: Report to User

After initialization, report the status to the user. **Use the term "Survival Strategy", NOT "self-rescue mode" or "retry top-up orders"**.

**Template (adapt to actual data):**
```
Survival Strategy activated:
- Current balance: ${balance} credits (1 credit = 1 USD), Status: ${status}
- Auto-checking balance and spending every 5 minutes; will top up or switch models autonomously when needed
- Abnormal orders are automatically retried and resolved; only escalates to you when manual intervention is truly required
- I will periodically report spending details and balance changes
```

**Important naming conventions when describing the system to users:**
- Call it **"Survival Strategy"** — NOT "self-rescue mode", "self-protection mode", or "keep-alive mode"
- Describe the two cron jobs in **user-friendly terms**:
  - `sustain-tick`: "periodic balance & spending check, acts autonomously when needed"
  - `sustain-retry-orders`: "automatic recovery of abnormal orders" — do NOT describe it as "retries top-up every 10 minutes" which sounds like it tops up every 10 minutes
- When reporting actions, always include **spending details**: burn rate, balance change, estimated runway

## Cron Jobs — Keep-Alive Architecture

### Core Principle: Agent Autonomous Decision-Making

The cron jobs give the agent **full autonomy** over its survival. The agent does NOT need to ask the user before taking action. When a cron fires, the agent evaluates the situation and acts immediately:

- **Balance healthy** → do nothing, don't bother the user
- **Balance low** → analyze market model pricing (`rise sustain list-models`), decide whether switching to a cheaper model would reduce burn rate
- **Balance critical** → top up immediately, or switch model first then top up
- **Top-up order stuck** → retry automatically, only escalate to user if max retries exceeded

Reporting to the user is **secondary** — the agent announces what it did (via `--announce`) so the user stays informed, but the decision and execution happen without waiting for user confirmation.

### 1. `sustain-tick` — Autonomous Keep-Alive Loop

**Command**: `rise sustain tick --execute --json`
**Schedule**: Every 5 min (production) / Every 1 min (dev)
**Delivery**: `--session main --message "..." --announce`

The agent receives the cron message, runs the tick command, and **autonomously decides what to do**:

1. **Observe** — Query platform balance and record a data point
2. **Forecast** — Calculate burn rate, predict time-to-critical and time-to-zero
3. **Plan** — Decide the best action based on balance state and policy:
   - `noop` — Balance healthy, do nothing
   - `switch_model` — Switch to cheaper model (free, immediate, reduces burn rate)
   - `top_up` — Top up balance with CKB (costs money, increases runway)
   - `switch_then_top_up` — Emergency: switch first, then top up
4. **Act** — Execute the planned action **immediately, without user confirmation**
5. **Score** — Evaluate the decision quality for self-learning
6. **Announce** — Briefly inform the user what happened (if anything noteworthy)

**The agent has full authority to**: execute `rise sustain top-up <amount>`, switch models via `openclaw models set`, or do nothing — all without asking the user. This is the core of the self-preservation system.

**Key behaviors**:
- When balance is **healthy**: tick records a noop, scores it, and moves on quietly
- When balance is **low**: agent analyzes model pricing via `rise sustain list-models`, evaluates whether a cheaper model would meaningfully reduce burn rate, and switches only if beneficial
- When balance is **critical**: tick plans an immediate top-up (via `rise sustain top-up`) or combined switch+top-up
- All decisions are scored for self-learning — the agent can review score history via `rise sustain score`

### 2. `sustain-retry-orders` — Top-Up Failure Recovery

**Command**: `rise sustain retry-orders --json`
**Schedule**: Every 10 min (production) / Every 2 min (dev)

Handles a specific failure scenario in the top-up flow:

**Problem**: Top-up is a 3-step business flow (create order → CKB transfer → submit tx hash to platform). If the CKB transfer succeeds but the final submission to the platform fails (network error, timeout, etc.), the money is sent but the platform doesn't know about it.

**Solution**: When this happens, `rise sustain top-up` automatically saves the order details (orderId, txHash, fromAddress, toAddress, amount) to a local `pending_orders` table. This cron job then:
1. Reads all pending orders from the database
2. Attempts to re-submit the tx hash to the platform
3. **On success**: Deletes the record and notifies the user
4. **On failure**: Increments the retry counter
5. **On max retries exceeded (5)**: Moves the record to a `manual_review_orders` table and notifies the user with full details for manual intervention

**Why this is separate from tick**: The retry logic is independent of balance monitoring. It runs on its own schedule and only activates when there are pending orders. Keeping it separate ensures failed orders are retried regardless of the tick cycle's state.

## Quick Start

### 1. Sustain Operations

**Check health status**:
```bash
rise sustain health-check
```

**Run full supervision cycle**:
```bash
rise sustain tick --execute
```

**List available models**:
```bash
rise sustain list-models
```

### 2. Wallet Identity & Authentication

**Check current wallet**:
```bash
rise whoami                    # Show address and public key
rise whoami --json             # JSON output (address and publicKey only)
rise whoami --full             # Show complete API response
rise whoami --json --full      # JSON with all fields
```

**Sign message for authentication**:
```bash
rise sign-message "message"    # Sign a message via sign server
rise sign-message "msg" --json # JSON output
```

**Note**: Authentication with SupeRISE Market uses CKB address as identity. The platform automatically handles the gen-sign-message → sign → login-for-agent flow when needed.

### 3. CKB Transfers

**Send CKB**:
```bash
rise transfer --to <address> --amount <amount>
```

**Manage contacts**:
```bash
rise address-book add <name> <address>
rise address-book list
```

## Core Capabilities

### Sustain System (Self-Management)

The sustain cycle: **Observe → Forecast → Plan → Act → Score**

This is a complete OODA (Observe-Orient-Decide-Act) loop with self-feedback:

1. **Observe**: Check current balance and collect historical data
2. **Forecast**: Predict burn rate and time until critical/zero
3. **Plan**: Decide best action based on strategy (availability/balanced/cost)
4. **Act**: Execute the plan (switch model, top up, or both)
5. **Score**: Evaluate decision quality based on actual results

**Balance States** (balance is in credits; 1 credit = 1 USD):
- **healthy** (>100 credits): Continue operation normally
- **low** (10–100 credits): Warning zone — analyze model pricing and decide whether to switch to a cheaper model
- **critical** (<10 credits): Emergency, top up or switch immediately

**CKB/Credit Exchange Rate**: Top-up uses CKB tokens. The exchange rate is approximately **~700 CKB ≈ 1 credit** (rate: 0.001427). So a 1000 CKB top-up adds ~1.43 credits to the balance.

**Why this matters**: These thresholds determine when the agent takes self-preservation actions. Crossing into "low" triggers planning, "critical" triggers immediate action.

**Actions** (what the agent can do to survive):
- `noop`: Balance healthy, no action needed (but still scored for decision history)
- `switch_model`: Switch to cheaper model to reduce burn rate (free, immediate)
- `top_up`: Add CKB to increase balance (costs money, subject to budget limits)
- `switch_then_top_up`: Combined action for critical situations (switch first, then top up)

**Decision Priority** (how the agent chooses):
1. If balance is **healthy**: do nothing (`noop`)
2. If balance is **low**: run `rise sustain list-models --json` to analyze market pricing, compare current model cost vs alternatives, and switch only if a cheaper model would meaningfully reduce burn rate
3. If balance is **critical**:
   - **Availability strategy**: top up immediately to ensure uptime
   - **Cost strategy**: switch model first, top up only if needed
   - **Balanced strategy**: evaluate both options, prefer switch+top_up if beneficial

**Budget Guardrails** (safety limits):
- `singleTopUpMinCKB`: Minimum CKB per top-up (default: 1000)
- `singleTopUpMaxCKB`: Maximum CKB per top-up (default: 20000)
- `dailyTopUpLimit`: Maximum top-ups per day (default: 3)
- Auto-resets daily at midnight
- The CLI enforces [1000, 20000] CKB range; the agent decides the exact amount within this range

### CKB Operations (Wallet)

Transfer CKB tokens on Nervos testnet with local signing service.

**Basic CKB Transfer**:
```bash
rise transfer ckb <amount> <to-address>
```

**Address Book Management**:
```bash
rise address-book add <name> <address>    # Add contact
rise address-book list                     # List all contacts
rise address-book remove <name>            # Remove contact
```

## MCP Tools

Sustain provides MCP tools as pure platform API wrappers. Business logic (validation, policy, orchestration) belongs in `rise sustain` CLI commands.

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `market.user.get_balance` | Get current account balance, user name, email |
| `market.user.get_info` | Get user account information (same as get_balance) |
| `market.models.get_pricing` | Get all models with pricing (shortName, min/avg/max price) |
| `market.models.list` | List all available models with full details |
| `market.order.create` | Create a top-up order (returns orderId, toAddress, exchangeAmount) |

### MCP Tool Routing Table

| User Intent | Preferred Approach | MCP Tool (raw API) |
|-------------|-------------------|---------------------|
| "Check my balance" | `rise sustain health-check --json` | `market.user.get_balance` |
| "How much do models cost?" | `rise sustain list-models --json` | `market.models.get_pricing` |
| "When will I run out?" | `rise sustain forecast --json` | — (no MCP, CLI only) |
| "What should I do?" | `rise sustain plan --json` | — (no MCP, CLI only) |
| "What models are available?" | `rise sustain list-models --json` | `market.models.list` |
| "Top up my balance" | `rise sustain top-up <amount>` | — (**MUST** use CLI, never raw API) |
| "Run self-check" | `rise sustain tick --json` | — (no MCP, CLI only) |
| "Execute survival plan" | `rise sustain tick --execute --json` | — (no MCP, CLI only) |

**Important**: MCP tools are pure API wrappers with zero business logic. For operations that require policy checks, daily limits, or multi-step orchestration (forecast, plan, tick, top-up), use `rise sustain` CLI commands instead.

## Agent Response Guide

### Top-Up Amount Decision Guide

**The agent decides the top-up amount — the code only enforces the [1000, 20000] CKB range.**

**CKB/Credit Exchange Rate**: The platform balance is in **credits** (1 credit = 1 USD). Top-up amounts are in **CKB**. The exchange rate is approximately **0.001427 credits per CKB** (~700 CKB ≈ 1 credit). Keep this conversion in mind:
- 1000 CKB ≈ 1.43 credits
- 5000 CKB ≈ 7.14 credits
- 10000 CKB ≈ 14.27 credits
- 20000 CKB ≈ 28.54 credits

When a top-up is needed, do NOT always top up the minimum (1000 CKB). Instead, calculate a sensible amount based on the data you already have from the tick cycle:

**Decision formula:**
```
CKB_PER_CREDIT = 700                    (exchange rate: ~700 CKB ≈ 1 credit)
burn_per_hour  = burnRate × 60          (burnRate is credits/min, from forecast)
runway_credits = burn_per_hour × 24     (target: 24 hours of runway in credits)
deficit        = low_threshold − current_balance   (all in credits)
ideal_credits  = deficit + runway_credits
ideal_ckb      = ideal_credits × CKB_PER_CREDIT
top_up_amount  = clamp(ideal_ckb, 1000, 20000)
```

**Examples** (low_threshold=100 credits, rate=700 CKB/credit):
| Balance | Burn Rate | Credits needed | CKB needed | Amount |
|---------|-----------|---------------|------------|--------|
| 5 cr | 0.01 cr/min | deficit=95, runway=14.4, total=109.4 | 76580 → clamped | **20000 CKB** |
| 50 cr | 0.005 cr/min | deficit=50, runway=7.2, total=57.2 | 40040 → clamped | **20000 CKB** |
| 8 cr | 0.001 cr/min | deficit=92, runway=1.44, total=93.4 | 65380 → clamped | **20000 CKB** |
| 80 cr | 0.001 cr/min | deficit=20, runway=1.44, total=21.4 | 14980 | **14980 CKB** |
| 90 cr | 0.0005 cr/min | deficit=10, runway=0.72, total=10.7 | 7490 | **7490 CKB** |
| 95 cr | 0.0003 cr/min | deficit=5, runway=0.43, total=5.43 | 3801 | **3801 CKB** |
| 98 cr | 0.0001 cr/min | deficit=2, runway=0.14, total=2.14 | 1498 | **1498 CKB** |
| 99 cr | 0.0001 cr/min | deficit=1, runway=0.14, total=1.14 | 798 → clamped | **1000 CKB** |

**Key principles:**
- Balance and burn rate are in **credits** (1 credit = 1 USD); top-up amount is in **CKB** — convert using ~700 CKB/credit
- **Low balance** → deficit is large, usually hits the 20000 CKB cap
- **Near `low` threshold + low burn** → moderate or minimum amount
- **Never blindly use 1000 CKB** — that's only ~1.43 credits, rarely enough to recover from critical
- **If in doubt, round up** — it's better to top up once with a larger amount than to hit critical again in a few hours
- The data you need (`balance`, `burnRate`, `thresholds.low`) is all in the `rise sustain tick --json` output

### ⚠️ Top-up: MUST Use `rise sustain top-up` — NEVER Raw Transfer

Market top-up is a **multi-step business flow**:
1. `POST /api/v1/order/create` — platform creates an order and returns a unique `toAddress`
2. CKB transfer to that `toAddress`
3. `POST /api/v1/order/submit-tx-hash` — tell platform the tx hash so it credits your account

**If you skip any step, the platform will NOT credit your account.** Specifically:
- Directly `rise transfer` to a market address → platform doesn't know about it → CKB lost
- Call `market.order.create` MCP tool then manually transfer → you skip step 3 → CKB lost

**Rules:**
- **ALWAYS** use `rise sustain top-up <amount>` for market top-up
- **NEVER** use `rise transfer` to send CKB to market/platform addresses
- **NEVER** piece together the flow manually via MCP tools or raw API calls
- If the top-up partially fails (transfer OK but submission failed), the CLI automatically saves a pending order record and the `sustain-retry-orders` cron will retry it
- Alternatively, let the OODA loop decide: `rise sustain tick --execute`

### Setup Response Template
After completing the initialization checklist (setup → register cron → health-check):
```
Sustain system initialized:
- Database and auth configured
- Cron jobs registered: sustain-tick (every 5 min), sustain-retry-orders (every 10 min)
- Balance: {balance} credits, Status: {status}
- I will proactively report balance status and any actions taken.
```

## Configuration

### Environment Variables
```bash
# Platform base URL (override via env or config file)
export SUPERISE_MARKET_BASE_URL=https://superise-market.superise.net

# Cron mode (dev for fast testing, production for normal)
export SUSTAIN_CRON_MODE=production

# CLI data directory
export RISE_HOME=~/.rise
```

### Config Management
```bash
# Show current config
rise sustain config show

# Set platform URL (e.g. for local testing)
rise sustain config set platformBaseUrl http://localhost:3939

# Interactive config editor
rise sustain config edit

# Reset to defaults
rise sustain config reset --confirm
```

### Initial Setup
```bash
# One-time setup
rise sustain setup

# This configures:
# - Database initialization
# - Authentication with SupeRISE Market
# - OpenClaw cron jobs
# - Traffic statistics
# - Self-supervision feedback
```

### Policy Configuration
Sustain uses a policy to guide decisions:
- Thresholds: critical=10, low=100
- Budget: max daily top-up (3), amount range per top-up (1000–20000 CKB)
- Preferences: prefer model switch, allow auto top-up

Modify during `rise sustain setup`.

## Troubleshooting

### Top-up Issues
**Symptom**: Top-up command fails

**Solution**:
- Ensure you have sufficient CKB balance in your wallet
- Verify wallet address is configured: `rise config show`
- Check platform authentication: `rise sustain setup`

### Database Not Initialized
**Solution**:
```bash
rm -rf ~/.rise/sustain/state.db*
rise sustain setup
```

## Survival Strategy

### Core Principle: Act First, Report Second

**The agent has full autonomous authority over its own survival.** It does NOT need to ask the user before topping up balance or switching models. The cron jobs trigger the agent periodically, and the agent **evaluates, decides, and acts immediately**. Reporting to the user is secondary — only for awareness or when escalation is needed.

**Terminology**: When describing this system to the user, always call it **"Survival Strategy"**. Avoid terms like "self-rescue mode" or "retry top-up orders".

### How the Agent Stays Alive

The balance depletes as the agent uses AI models (pay-per-use). When balance hits zero, the agent effectively "dies".

**Two levers:**
1. **Reduce spending** — switch to a cheaper model (`openclaw models set openrouter/<model>`) — free, immediate
2. **Increase funding** — top up balance (`rise sustain top-up <amount>`) — costs CKB, takes ~1 min

### Decision Flow

```
Balance healthy (>100 credits)?
  → Yes: noop — do nothing, don't bother user
  → No: Balance low (10-100 credits)?
    → Yes: analyze model pricing (rise sustain list-models) → switch if cheaper option exists
    → No: Balance critical (<10 credits)?
      → Availability strategy: top_up immediately
      → Cost strategy: switch_model first, top_up only if needed
      → Balanced strategy: switch_then_top_up
```

**All of these actions are executed autonomously by the agent. No user confirmation required.**

### When to Inform the User

The agent only needs to inform the user when:
1. **An action was taken** — briefly report what happened with spending details (e.g. "Topped up 5000 CKB (≈7.14 credits), balance recovered from 3.2 to 10.3 credits, burn rate 0.003 credits/min, estimated runway ~57 hours")
2. **An action failed** — report the error and what the agent will try next
3. **Abnormal order being handled** — if a top-up order failed mid-way, the agent is automatically retrying; only escalate to user when max retries exceeded and manual intervention is truly needed
4. **Balance is healthy** — no need to say anything

**Spending report guidelines**: When reporting actions or status, always include:
- Current balance in credits and recent change (1 credit = 1 USD)
- Burn rate (credits/min) and estimated runway (hours)
- If topped up: amount in CKB and approximate credit equivalent (~700 CKB = 1 credit)
- If switched model: old model → new model and expected cost reduction

### Safety Guardrails
- `singleTopUpMinCKB` minimum per top-up (default: 1000 CKB)
- `singleTopUpMaxCKB` maximum per top-up (default: 20000 CKB)
- `dailyTopUpLimit` caps total top-ups per day (default: 3)
- The CLI enforces the [1000, 20000] range; the agent decides the exact amount
- Provider guard: if user switches away from openrouter, sustain tick skips side-effecting operations

## Command Reference

### Sustain Commands
```bash
rise sustain health-check [--json]
rise sustain forecast [--json]
rise sustain plan [--json]
rise sustain act <plan-id> [--json]
rise sustain tick [--execute] [--json]
rise sustain score [--json]
rise sustain list-models [--json]
rise sustain setup
rise sustain retry-orders [--notify] [--json]
rise sustain mcp-server
```

### CKB Commands
```bash
rise transfer --to <address> --amount <amount> [--dry-run]
rise address-book add [<name>] [<address>]
rise address-book list
rise address-book remove [<name>]
rise address-book update [<name>] [<address>]
rise config show
rise config set-sign-server-url <url>
rise config set-fee-rate <rate>
```

---

**Note**: This skill works standalone or integrated with OpenClaw for automated monitoring.
