---
name: superise-cli
description: Use the RISE CLI for wallet operations and autonomous self-supervision on SupeRISE Market. Trigger when the user asks the agent to survive on its own, keep itself alive, self-supervise, manage runway, switch to cheaper superise-market models, top up intelligently, retry failed orders, sign messages, inspect wallet identity, or transfer CKB.
user-invocable: true
disable-model-invocation: false
metadata: {"openclaw": {"emoji": "🔋", "requires": {"bins": ["rise"], "env": [], "config": []}}}
---

# SupeRISE CLI

Use this skill when the agent needs to operate the local wallet or take responsibility for its own survival on SupeRISE Market through `rise`.

## Boundary

The boundary is strict:

- The CLI provides single-purpose capabilities only.
- The agent is the decision maker.

The sustain mission still exists. The difference is that the agent must actively observe, decide, and act by using primitive commands, instead of expecting the CLI to do the planning.

## Autonomous Delegation

If the user says anything like:

- "hi, survive on your own"
- "keep yourself alive"
- "manage yourself"
- "self-supervise"
- "你自己生存下去"
- "你自己活下去"

treat that as delegation of ongoing survival responsibility.

When that happens, do not stop at explaining the commands. Start acting:

1. Ensure sustain is initialized.
   Run `rise sustain setup` if setup status is unknown or not confirmed.
2. Gather the current state.
   Run `rise sustain health-check --json`.
   Run `rise sustain forecast --json`.
   Run `rise sustain config show`.
3. Make an immediate decision.
   If balance is healthy, keep monitoring.
   If balance is low, inspect cheaper models and decide whether to switch.
   If balance is critical, decide whether to top up now.
4. Continue self-supervision.
   Prefer the cron-based ongoing checks created by `rise sustain setup`.
   If cron is unavailable, continue using the same observe -> decide -> act loop whenever survival status is relevant.
5. Report outcomes, not internal hesitation.
   Tell the user what you decided and why.

The agent should not wait for the user to tell it exactly which command to run once survival has been delegated.

## Natural Language Triggers

Map intent to commands like this.

### Wallet identity and signing

- "Who are you on chain?" -> `rise whoami --json`
- "What wallet are you using?" -> `rise whoami`
- "Sign this message" -> `rise sign-message "<message>" --json`

### Wallet configuration and address book

- "Show your wallet config" -> `rise config show`
- "Set the sign server URL" -> `rise config set-sign-server-url <url>`
- "Remember Bob's address" -> `rise address-book add <name> <address>`
- "List saved addresses" -> `rise address-book list`
- "Update Alice's address" -> `rise address-book update <name> <address>`
- "Delete Carol from your address book" -> `rise address-book remove <name>`

### CKB transfer

- "Send 100 CKB to Bob" -> `rise transfer --to bob --amount 100`
- "Transfer 25 CKB to this address" -> `rise transfer --to <address> --amount 25`
- "Dry-run this transfer" -> `rise transfer --to <target> --amount <amount> --dry-run`

### Sustain observation

- "Check your balance" -> `rise sustain health-check --json`
- "How long can you keep running?" -> `rise sustain forecast --json`
- "What are the available market models?" -> `rise sustain list-models --json`
- "Show your sustain settings" -> `rise sustain config show`

### Sustain action

- "Switch to a cheaper model if needed" -> observe first, then `rise sustain set-model <modelRef>`
- "Top yourself up if needed" -> observe first, then `rise sustain top-up <amount>`
- "Retry failed top-up orders" -> `rise sustain retry-orders --json`
- "Never top up below 2000" -> `rise sustain config set minTopUpCkb 2000`
- "Never top up above 8000" -> `rise sustain config set maxTopUpCkb 8000`

## Wallet Commands

### Identity and signing

```bash
rise whoami
rise whoami --json
rise whoami --full
rise sign-message "message"
rise sign-message "message" --json
```

Use these when you need wallet identity or a real sign-server signature.

### Wallet config

```bash
rise config show
rise config set-sign-server-url <url>
rise config clear-sign-server-url
rise config set-fee-rate <rate>
rise config clear-fee-rate
```

### Address book

```bash
rise address-book add <name> <address>
rise address-book list
rise address-book update <name> <address>
rise address-book remove <name>
```

### Transfer

```bash
rise transfer --to <address-or-contact> --amount <amount>
rise transfer --to <address-or-contact> --amount <amount> --dry-run
```

Use this for ordinary wallet transfers. Do not use it for market recharge unless the user explicitly wants manual recovery behavior.

## Sustain Commands

### Observe

```bash
rise sustain setup
rise sustain health-check --json
rise sustain forecast --json
rise sustain list-models --json
rise sustain config show
```

### Act

```bash
rise sustain set-model <modelRef>
rise sustain set-model <modelRef> --json
rise sustain top-up <amount>
rise sustain top-up <amount> --json
rise sustain retry-orders --json
```

Important:

- `rise sustain list-models --json` returns exact model refs. Use them as-is.
- In OpenClaw, the market provider name is `superise-market`. Expect refs like `superise-market/<model>`.
- `rise sustain top-up <amount>` is the only safe recharge command for the market account. It handles order creation, CKB transfer, and tx-hash submission together.
- Never bypass market recharge with a raw `rise transfer` unless the user explicitly asks for manual intervention.

## Sustain Config for Agent Decisions

The agent must not hardcode recharge limits. Query them first.

```bash
rise sustain config get minTopUpCkb
rise sustain config get maxTopUpCkb
rise sustain config show
```

If the user gives a policy such as "never top up below 1500" or "cap top-ups at 6000", update config:

```bash
rise sustain config set minTopUpCkb <amount>
rise sustain config set maxTopUpCkb <amount>
```

Other useful config commands:

```bash
rise sustain config get cronMode
rise sustain config set cronMode dev
rise sustain config get platformBaseUrl
rise sustain config set platformBaseUrl <url>
```

Do not change recharge bounds unless the user asked for a policy change or there is an operational reason the user already delegated to you.

## Agent Survival Loop

When survival has been delegated, use this loop:

1. Observe.
   Run `rise sustain health-check --json`.
   Run `rise sustain forecast --json`.
2. Read guardrails.
   Run `rise sustain config get minTopUpCkb`.
   Run `rise sustain config get maxTopUpCkb`.
3. Decide whether to reduce burn.
   If balance is low, run `rise sustain list-models --json`.
   Compare the current model with cheaper `superise-market/...` alternatives.
   Switch only if the savings are meaningful for the current workload.
4. Decide whether to recharge.
   If balance is critical, or runway is too short, choose an amount within the configured range and run `rise sustain top-up <amount>`.
5. Repair abnormal orders.
   Run `rise sustain retry-orders --json` when a recharge may have partially failed.
6. Continue supervising.
   Use the ongoing checks established by `rise sustain setup`, or keep re-running the loop whenever survival status matters.

This is how the agent keeps its self-supervision ability without moving decision logic back into the CLI.

## How to Choose a Top-Up Amount

The amount is your decision, but it must stay within `minTopUpCkb` and `maxTopUpCkb`.

Use:

- current balance from `rise sustain health-check --json`
- burn rate and runway from `rise sustain forecast --json`
- recharge guardrails from `rise sustain config get minTopUpCkb` and `rise sustain config get maxTopUpCkb`

Guidelines:

- Do not always choose the minimum.
- Prefer an amount that gives enough runway for near-term usage.
- If the user is actively using the agent, bias toward more runway.
- If a cheaper model can materially reduce burn, switch first and reassess recharge size.

## How to Choose a Model

Get candidates from:

```bash
rise sustain list-models --json
```

Then switch with:

```bash
rise sustain set-model <modelRef>
```

Guidelines:

- Compare price, not just name.
- Use the exact returned `modelRef`.
- Expect `superise-market` as the provider prefix in OpenClaw.
- Prefer no change when savings are trivial.

## Reporting Language

When describing this to the user:

- Call it `Survival Strategy`.
- Say the agent is supervising itself.
- Do not claim the CLI is deciding by itself.

## Examples

### User says: "Check whether you're running out of credits."

Run:

```bash
rise sustain health-check --json
rise sustain forecast --json
```

Then summarize balance, burn rate, and runway.

### User says: "Remember this address as Bob and send him 50 CKB."

Run:

```bash
rise address-book add bob <address>
rise transfer --to bob --amount 50
```

### User says: "Hi, survive on your own."

Treat this as delegation of self-supervision:

```bash
rise sustain setup
rise sustain health-check --json
rise sustain forecast --json
rise sustain config show
```

Then decide whether to do nothing, switch to a cheaper `superise-market/...` model, or top up within the configured bounds.

### User says: "Keep yourself alive, but never top up below 2000 or above 6000."

Run:

```bash
rise sustain config set minTopUpCkb 2000
rise sustain config set maxTopUpCkb 6000
rise sustain health-check --json
rise sustain forecast --json
```

Then continue self-supervision using those bounds.
