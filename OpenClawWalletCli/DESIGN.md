# RISE CLI - Design Document

## Overview

RISE is a testnet-only CLI for building and sending CKB transfers using CCC. It integrates with a local signing service for secure private key management. It is designed for fast, interactive use: any missing required input is collected via prompts.

## Runtime and Build

- **Dev**: Bun runs the TypeScript entry directly (`bun run dev`).
- **Build**: Bun builds a single-file ESM bundle for Node.js (`bun run build`), producing `rise.js`.

## UX Principles

- Always prompt when required information is missing.
- Prefer simple, explicit flows over hidden defaults.
- `config show` displays raw values (no masking).

## Command Structure

```
rise <command> [subcommand] [options]
```

### Configuration

- `rise config show`
- `rise config set-sign-server-url <url>`
- `rise config set-fee-rate <rate>`
- `rise config clear-fee-rate`

### Transfers

```
rise transfer ckb [options]
```

Options:
- `--to <address>`: recipient CKB address (required)
- `--amount <amount>`: amount in CKB (required, supports decimals like "1.5" for 1.5 CKB)
- `--fee-rate <rate>`: shannon per 1000 bytes (optional)
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

**Output behavior:**
- JSON output is default; `--no-json` disables it
- Regardless of JSON output, always prints transaction hash and fee
- Dry runs always print estimated cycles and fee, and never submit

### Address Book

The address book allows storing frequently used addresses with friendly names for quick access.

- `rise address-book add [<name>] [<address>]`
- `rise address-book list`
- `rise address-book remove [<name>]`
- `rise address-book update [<name>] [<address>]`

**Usage:**
- Names must be 50 characters or less
- Names cannot contain special characters like `< > : " / \ | ? *`
- Addresses are validated before being added
- When transferring, you can use a contact name instead of an address
- The CLI will automatically look up the address from the address book

**Transfer using contact name:**
```bash
rise transfer ckb --to alice --amount 100
```
This will look up "alice" in the address book and use the stored address.

## Fee Rate

- Config uses `feeRate: number | null` (minimum `1000`).
- `--fee-rate` overrides config.
- If `feeRate` is `null`, RISE:
  1. Tries `client.getFeeRateStatistics().median`
  2. Falls back to `DEFAULT_FEE_RATE` env var
  3. Falls back to CCC minimum fee rate (1000 shannon per 1000 bytes)

**Fee Rate Resolution Order:**
1. Command-line `--fee-rate` option
2. Config file `feeRate` value
3. Node fee rate median (queried from CKB node)
4. `DEFAULT_FEE_RATE` environment variable
5. CCC minimum fee rate

## Dry-Run Behavior

- Builds the transaction and estimates cycles.
- Does **not** submit to the transaction pool.

## Output Behavior

- JSON output is the default (use `--no-json` to disable).
- Regardless of JSON output, the CLI always prints the transaction hash and fee.
- Dry runs always print estimated cycles and fee.

## Configuration

Location: `~/.rise/config.json` (override with `RISE_CONFIG_DIR`).

**Configuration Structure:**
- `rpc`: CKB node RPC URL
- `indexer`: CKB indexer URL
- `signServerUrl`: Local sign server URL (required for transfer operations)
- `feeRate`: Custom fee rate in shannon/1000 bytes, or null to auto-fetch from node
- `addressBook`: Address book for storing frequently used addresses (name → address mapping)

Example:

```json
{
  "rpc": "https://testnet.ckb.dev",
  "indexer": "https://testnet.ckb.dev/indexer",
  "signServerUrl": "http://127.0.0.1:18799",
  "feeRate": null,
  "addressBook": {
    "alice": "ckb1qyqgsm5fv7xqy8m4u9xv2kq8pqvxpkv3q8xc8kqyqgsm5fv7xqyq"
  }
}
```

## Implementation Architecture

- **CLI Framework**: Commander.js
- **Prompts**: @clack/prompts
- **CKB SDK**: @ckb-ccc/shell
- **Config Store**: conf

Project layout (current structure):

```
src/
  index.ts
  commands/
    address-book/
      actions/
      helps.ts
      index.ts
    config/
      actions/
      helps.ts
      index.ts
    transfer/
      actions/
      helps.ts
      index.ts
  services/
    ckb.ts
    sign-server.ts
  utils/
    config.ts
    constants.ts
    errors.ts
    formatter.ts
    prompts.ts
    tx-builder.ts
    validator.ts
  types/
    index.ts
```

Each command owns its own actions, and shared logic for that command lives in `helps.ts`.

**Local Sign Server Integration:**
- The CLI uses a locally deployed signing service for secure private key management
- Sender address is automatically fetched from the signing service
- Unsigned transactions are built locally and submitted to the signing service for signing and broadcasting
- Sign server API endpoints:
  - GET `/key-config/list` - Fetch current address, public key, and balance
  - POST `/sign/sign-ckb-transaction` - Submit unsigned transaction for signing and broadcasting
