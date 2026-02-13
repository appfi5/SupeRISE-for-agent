# RISE CLI

RISE is a testnet-only CLI for building and sending CKB transactions. It uses the CCC (CKB Client & Crypto) SDK for blockchain operations and integrates with a local signing service for secure private key management.

## Why it exists

Most CKB examples assume you already know scripts, deps, and fee rate details. RISE wraps CCC so you can focus on intent ("send 100 CKB to ckb1abc...") while still producing explicit, inspectable transactions. The CLI provides interactive prompts for missing parameters and is designed for fast, explicit address-based operations.

**Key constraint:** All operations are on CKB testnet only.

## Requirements

### For Development
- Bun (dev + build runtime)

### For End Users
- **None** - The compiled executable is completely standalone and includes the Bun runtime
- Local signing service URL for transfer operations

## Development

```bash
bun install
bun run dev --help
```

## Installation

### For Local Development & AI Agent Integration

1. **Build the CLI**:
   ```bash
   bun run build
   ```
   This creates `bin/rise.js` that can be linked globally.

2. **Link globally** (makes `rise` command available everywhere):
   ```bash
   bun link
   ```
   
   Now you can use `rise` from any directory:
   ```bash
   rise --version
   rise --help
   ```

3. **For AI Agent Integration** (OpenClaw, Claude, etc.):
   
   Copy the `SKILL.md` file to your agent's skills directory:
   
   **For OpenClaw**:
   ```bash
   # Workspace-specific (recommended)
   mkdir -p <your-openclaw-workspace>/skills/rise-cli
   cp SKILL.md <your-openclaw-workspace>/skills/rise-cli/
   
   # Or global (available to all agents)
   mkdir -p ~/.openclaw/skills/rise-cli
   cp SKILL.md ~/.openclaw/skills/rise-cli/
   ```
   
   **OpenClaw Integration Tips**:
   - **Telegram Bot**: Connect OpenClaw to Telegram for mobile CKB transfers via chat
   - **Feishu/Lark Bot**: Integrate with Feishu for team-based blockchain operations
   - **Discord Bot**: Use OpenClaw Discord integration for community token distribution
   - **WhatsApp**: Enable WhatsApp integration for peer-to-peer CKB transfers
   - **Slack**: Connect to Slack for workplace blockchain workflows
   
   After integration, you can send messages like "Send 100 CKB to bob" directly in your chat app!
   
   **For Claude**:
   ```bash
   mkdir -p <your-claude-workspace>/.cascade/skills
   cp SKILL.md <your-claude-workspace>/.cascade/skills/rise-cli.md
   ```
   
   After placing the skill file, restart your AI agent. The agent will be able to understand natural language commands like:
   - "Send 100 CKB to ckb1abc..."
   - "Transfer 50 CKB to this address: ckb1xyz..."

### For Distribution (Standalone Binary)

If you need a standalone executable for distribution:

```bash
bun run build:bin
```

This produces a standalone executable `bin/rise` (~57MB) that:
- Includes the Bun runtime and all dependencies
- Can be copied and run anywhere without any dependencies or installation
- Works on the same platform it was built on (macOS ARM64, Linux x64, etc.)

To distribute:
1. Build: `bun run build:bin`
2. Copy `bin/rise` to target machine
3. Make executable: `chmod +x bin/rise` (if needed)
4. Run: `./bin/rise --help`

### Unlink (if needed)

To remove the global link:
```bash
bun unlink
```

## Configuration

RISE stores config in `~/.rise/config.json`. Override location with `RISE_CONFIG_DIR` environment variable.

```bash
RISE_CONFIG_DIR=/tmp/rise bun run dev config show
```

**Configuration Structure:**
- `rpc`: CKB node RPC URL
- `indexer`: CKB indexer URL
- `signServerUrl`: Local sign server URL (required for transfer operations)
- `feeRate`: Custom fee rate in shannon/1000 bytes, or null to auto-fetch from node

**Fee Rate Resolution Order:**
1. Command-line `--fee-rate` option
2. Config file `feeRate` value
3. Node fee rate median (queried from CKB node)
4. `DEFAULT_FEE_RATE` environment variable
5. CCC minimum fee rate (1000 shannon per 1000 bytes)

## Commands

### config

```bash
rise config show
```

Output:
- Prints config file path
- Prints full config JSON (no masking)

```bash
rise config set-sign-server-url <url>
```

Options/args:
- `<url>`: Local sign server URL (e.g., http://127.0.0.1:18799). If omitted, prompts for URL.

Output:
- Prints confirmation that signing service URL was set

```bash
rise config set-fee-rate <rate>
```

Options/args:
- `<rate>`: number in shannon per 1000 bytes, must be >= 1000. If omitted, prompt.

Output:
- Prints confirmation with the new feeRate

```bash
rise config clear-fee-rate
```

Output:
- Prints confirmation that feeRate was cleared (will auto-fetch from node)

### transfer

```bash
rise transfer ckb [options]
```

Options:
- `--to <address>`: recipient CKB address (required, explicit addresses only)
- `--amount <amount>`: amount in CKB (required, supports decimals like "1.5" for 1.5 CKB)
- `--fee-rate <rate>`: shannon per 1000 bytes. If missing, uses config or auto-fetch
- `--dry-run`: build and estimate cycles only (no submission)
- `--no-json`: disable JSON output (JSON is default)

**Transfer Flow:**
1. Resolves recipient address (prompts if missing)
2. Validates and parses amount (prompts if missing)
3. Resolves fee rate (config → node median → default)
4. Builds unsigned transaction using public-key-based signer
5. Fetches wallet info (address, publicKey, balance) from local sign server
6. Validates balance is sufficient for transfer amount
7. Calculates fee from transaction inputs/outputs
8. If dry-run: estimates cycles, prints JSON, exits
9. Submits to local sign server for signing and broadcast
10. Prints transaction hash and fee

Output behavior:
- JSON output is default; `--no-json` disables it
- Regardless of JSON output, always prints transaction hash and fee
- Dry runs always print estimated cycles and fee, and never submit

**Example:**
```bash
# Interactive mode (prompts for missing values)
rise transfer ckb

# Direct command
rise transfer ckb --to ckb1qyq...l4d --amount 100

# With custom fee rate
rise transfer ckb --to ckb1qyq...l4d --amount 50.5 --fee-rate 2000

# Dry run to estimate
rise transfer ckb --to ckb1qyq...l4d --amount 100 --dry-run
```

## License

MIT
