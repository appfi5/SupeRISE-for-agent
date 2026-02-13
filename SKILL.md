---
name: openclaw-wallet
description: Complete OpenClaw Wallet CLI toolkit for CKB blockchain operations including local signer server setup, transfers, and address book management
user-invocable: true
disable-model-invocation: false
metadata: {"openclaw": {"emoji": "⛓️", "requires": {"bins": ["bun"], "env": [], "config": []}, "install": "bun install && bun run build && bun link"}}
---

# OpenClaw Wallet CLI

Complete toolkit for CKB blockchain operations with local signer server integration. This skill guides you through setting up the signer server and using the RISE CLI for secure CKB transfers on testnet.

## Setup Instructions

### Step 1: Install the Signer Server

**IMPORTANT:** Before using any CLI commands, you must first install and run the local signer server that manages your private keys securely.

Download and execute the installer script:

```bash
# Download the installer
curl -fsSL https://raw.githubusercontent.com/appfi5/OpenClawWallet/main/OpenClawWalletServer/src/install.sh -o /tmp/install-signer.sh

# Review the script contents (recommended)
cat /tmp/install-signer.sh

# Execute the installer
bash /tmp/install-signer.sh
```

This installer will:
- Set up the local signer server on your machine
- Configure the necessary dependencies
- Start the signer service (typically on `http://127.0.0.1:18799`)

After installation, verify the signer server is running:

```bash
# Check if signer server is accessible
curl http://127.0.0.1:18799/key-config/list
```

### Step 2: Build and Link the CLI

Once the signer server is running, build and install the CLI:

```bash
cd OpenClawWalletCli
bun install
bun run build
bun link
```

Now the `rise` command is available globally.

### Step 3: Configure CLI

Configure the CLI to connect to your signer server:

```bash
# Set the signer server URL
rise config set-sign-server-url http://127.0.0.1:18799

# Verify configuration
rise config show
```

## Command Reference

### Transfer CKB

**Command:**
```bash
rise transfer --to <address> --amount <amount> [--fee-rate <rate>] [--dry-run] [--no-json]
```

or

```bash
rise transfer ckb --to <address> --amount <amount> [--fee-rate <rate>] [--dry-run] [--no-json]
```

**Parameters:**
- `--to`: Recipient CKB address (required, only accepts addresses, not aliases)
- `--amount`: Amount in CKB (required)
- `--fee-rate`: Custom fee rate in shannon per 1000 bytes (optional)
- `--dry-run`: Estimate without sending (optional)
- `--no-json`: Disable JSON output (optional)

**Note:** The sender address is automatically obtained from the local signing service. No `--from` parameter is needed.

### Configuration Commands

**Show Configuration:**
```bash
rise config show
```

Displays current configuration including RPC, indexer, signing service URL, and fee rate.

**Set Signing Service URL:**
```bash
rise config set-sign-server-url <url>
```

Parameters:
- `<url>`: Local signing service URL (e.g., http://127.0.0.1:18799)

**Set Fee Rate:**
```bash
rise config set-fee-rate <rate>
```

Parameters:
- `<rate>`: Fee rate in shannon per 1000 bytes (must be >= 1000)

**Clear Fee Rate:**
```bash
rise config clear-fee-rate
```

Clears the custom fee rate and uses the default (node median or environment variable).

### Address Book Commands

**Add Contact:**
```bash
rise address-book add [<name>] [<address>]
```

Parameters:
- `[<name>]`: Contact name (optional, will prompt if not provided)
- `[<address>]`: CKB address (optional, will prompt if not provided)

**List Contacts:**
```bash
rise address-book list
```

Displays all saved contacts sorted alphabetically with their addresses.

**Remove Contact:**
```bash
rise address-book remove [<name>]
```

Parameters:
- `[<name>]`: Contact name to remove (optional, will prompt if not provided)

**Update Contact:**
```bash
rise address-book update [<name>] [<address>]
```

Parameters:
- `[<name>]`: Contact name to update (optional, will prompt if not provided)
- `[<address>]`: New CKB address (optional, will prompt if not provided)

**Transfer Using Contact Name:**
```bash
rise transfer --to <contact-name> --amount <amount>
```

When a contact name is provided instead of an address, the CLI will automatically look it up in the address book.

## Natural Language Examples

### Transfer Operations
- "Send 100 CKB to ckb1abc..."
- "Transfer 50 CKB to address 0x123..."
- "Send 1000 CKB to this address: ckb1xyz..."
- "Estimate the fee for sending 100 CKB to ckb1abc..." (dry run)

### Configuration
- "Show current config"
- "Set signing service URL to http://127.0.0.1:18799"
- "Set fee rate to 1500"
- "Clear custom fee rate"
- "Configure signing service"

### Address Book Management
- "Add alice to my address book with address ckb1abc..."
- "List all my contacts"
- "Remove alice from address book"
- "Update bob's address to ckb1xyz..."
- "Show my address book"
- "Send 100 CKB to alice" (uses contact name from address book)

## Implementation Guidelines

### Execution Pattern
1. Parse the user's natural language intent
2. Extract parameters (recipient address, amount, fee rate, etc.)
3. Map to the appropriate RISE CLI command
4. Execute the `rise` command directly
5. Parse and present output to user in a friendly format

### Error Handling
- **Signing service URL not set**: Suggest running `rise config set-sign-server-url` to configure
- **Invalid address**: Verify the address is a valid CKB address format (starts with ckb1 or ckt1)
- **Insufficient balance**: Inform user and suggest checking wallet balance
- **Invalid parameters**: Explain what's required and ask for clarification
- **Signing service errors**: Display the error message and suggest checking signing service URL or network connection
- **Contact not found**: When using a name that's not in address book, suggest adding it first or using a valid address
- **Duplicate contact name**: When adding a contact that already exists, suggest using update command instead
- **Contact name too long**: Names must be 50 characters or less
- **Invalid characters in name**: Names cannot contain special characters like < > : " / \ | ? *

### Safety Checks
- Confirm large transfers (e.g., > 1000 CKB) before executing
- For dry runs, clearly indicate no actual transfer occurred
- Remind users this is testnet only
- Ensure the local signing service is running and accessible
- Ensure recipient address is valid before executing transfer
- When using contact names, confirm the resolved address matches the intended recipient
- For address updates, show both old and new addresses for verification
- Validate address format before adding to address book to avoid storing invalid addresses

## Configuration

- **Default config location**: `~/.rise/config.json`
- **Override with environment variable**: `RISE_CONFIG_DIR=/custom/path`
- **Required configuration**: Signing service URL (use `rise config set-sign-server-url`)
- **Address book**: Stored in config.json under `addressBook` field (name → address mapping)
- **Addresses**: Accepts both raw CKB addresses and contact names from address book
- **Fee rate**: Can be set globally or per transaction
- **Network**: CKB testnet only
- **Installation**: Run `bun run build` and `bun link` in the project directory to make `rise` globally available

## Security Notes

- All operations are on CKB testnet only
- Private keys are managed by your local signing service, not stored in the CLI
- Ensure your local signing service is properly secured and accessible only to authorized users
- Always remind users this is testnet only
- Suggest using `--dry-run` for unfamiliar operations
- Interactive mode is available for all commands by omitting required parameters

## Technical Details

- CLI command: `rise` (globally available via bun link)
- Default JSON output for transfers (can be disabled with `--no-json`)
- Fee rate minimum: 1000 shannon per 1000 bytes
- Local signing service integration:
  - GET `/key-config/list` - Fetch current address, public key, and balance
  - POST `/sign/sign-ckb-transaction` - Submit unsigned transaction for signing and broadcasting
- Balance validation is performed client-side before transaction building
- Transaction signing is performed by the local signing service
- CKB decimals: 8 (1 CKB = 100,000,000 Shannon)
