---
name: rise-cli
description: Execute CKB blockchain operations including CKB transfers through the RISE CLI tool with local signing service integration on testnet
user-invocable: true
disable-model-invocation: false
metadata: {"openclaw": {"emoji": "⛓️", "requires": {"bins": [], "env": [], "config": []}, "install": ""}}
---

# RISE CLI

Execute CKB blockchain operations through the RISE CLI tool integrated with a local signing service. This skill enables natural language interaction with CKB testnet for sending CKB tokens and configuring the CLI. All private keys are managed by your local signing service, providing secure key management.

## When to Use This Skill

Use this skill when the user wants to:
- Send or transfer CKB tokens on the Nervos CKB testnet
- Manage contacts in an address book for quick access to frequently used addresses
- Configure RISE CLI settings (signing service URL, fee rate, view config)
- Interact with Nervos CKB blockchain using a local signing service
- Set up the local signing service for secure transaction signing

Keywords that should trigger this skill: CKB, Nervos, blockchain transfer, wallet, testnet, cryptocurrency, signing service, local wallet, address book, contacts

## Prerequisites

- RISE CLI must be installed and available in PATH (use `bun link` after building)
- Local signing service must be running and accessible (URL can be set up through this skill)
- For transfers, the wallet must have sufficient CKB balance
- All operations are on CKB testnet only

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

**Natural Language Mapping:**
- "Send X CKB to Y" → `rise transfer --to Y --amount X`
- "Transfer X CKB to address Y" → `rise transfer ckb --to Y --amount X`
- "Estimate fee for X CKB to Y" → `rise transfer --to Y --amount X --dry-run`

### Show Configuration

**Command:**
```bash
rise config show
```

Displays current configuration including RPC, indexer, signing service URL, and fee rate.

### Set Signing Service URL

**Command:**
```bash
rise config set-sign-server-url <url>
```

**Parameters:**
- `<url>`: Local signing service URL (e.g., http://127.0.0.1:18799)

**Natural Language Mapping:**
- "Set signing service URL to http://127.0.0.1:18799" → `rise config set-sign-server-url http://127.0.0.1:18799`
- "Configure signing service" → `rise config set-sign-server-url` (will prompt)

### Set Fee Rate

**Command:**
```bash
rise config set-fee-rate <rate>
```

**Parameters:**
- `<rate>`: Fee rate in shannon per 1000 bytes (must be >= 1000)

**Natural Language Mapping:**
- "Set fee rate to 1500" → `rise config set-fee-rate 1500`

### Clear Fee Rate

**Command:**
```bash
rise config clear-fee-rate
```

Clears the custom fee rate and uses the default (node median or environment variable).

### Address Book Commands

#### Add Contact

**Command:**
```bash
rise address-book add [<name>] [<address>]
```

**Parameters:**
- `[<name>]`: Contact name (optional, will prompt if not provided)
- `[<address>]`: CKB address (optional, will prompt if not provided)

**Natural Language Mapping:**
- "Add alice with address ckb1abc..." → `rise address-book add alice ckb1abc...`
- "Save bob's address" → `rise address-book add bob` (will prompt for address)
- "Create contact for charlie" → `rise address-book add charlie`

#### List Contacts

**Command:**
```bash
rise address-book list
```

Displays all saved contacts sorted alphabetically with their addresses.

**Natural Language Mapping:**
- "Show my contacts" → `rise address-book list`
- "List address book" → `rise address-book list`
- "What contacts do I have?" → `rise address-book list`

#### Remove Contact

**Command:**
```bash
rise address-book remove [<name>]
```

**Parameters:**
- `[<name>]`: Contact name to remove (optional, will prompt if not provided)

**Natural Language Mapping:**
- "Remove alice from address book" → `rise address-book remove alice`
- "Delete bob" → `rise address-book remove bob`
- "Remove contact charlie" → `rise address-book remove charlie`

#### Update Contact

**Command:**
```bash
rise address-book update [<name>] [<address>]
```

**Parameters:**
- `[<name>]`: Contact name to update (optional, will prompt if not provided)
- `[<address>]`: New CKB address (optional, will prompt if not provided)

**Natural Language Mapping:**
- "Update alice's address to ckb1xyz..." → `rise address-book update alice ckb1xyz...`
- "Change bob's address" → `rise address-book update bob` (will prompt for new address)

#### Transfer Using Contact Name

**Command:**
```bash
rise transfer --to <contact-name> --amount <amount>
```

When a contact name is provided instead of an address, the CLI will automatically look it up in the address book.

**Natural Language Mapping:**
- "Send 100 CKB to alice" → `rise transfer --to alice --amount 100`
- "Transfer 50 CKB to bob" → `rise transfer --to bob --amount 50`

**Note:** The CLI first tries to match the recipient as a contact name. If not found, it treats the value as a raw address.

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

### Output Parsing
- Transfer commands output JSON by default (unless `--no-json` is used)
- Address book commands output human-readable text (not JSON)
- Parse transaction hash and fee from transfer output
- Present address book contacts in a friendly, numbered list
- For dry runs, emphasize it's an estimate and no transaction was sent
- Note that sender address is obtained from the local signing service
- When using contact names for transfers, mention the resolved address for transparency

### Safety Checks
- Confirm large transfers (e.g., > 1000 CKB) before executing
- For dry runs, clearly indicate no actual transfer occurred
- Remind users this is testnet only
- Ensure the local signing service is running and accessible
- Ensure recipient address is valid before executing transfer
- When using contact names, confirm the resolved address matches the intended recipient
- For address updates, show both old and new addresses for verification
- Validate address format before adding to address book to avoid storing invalid addresses

### Local Signing Service Integration
- The CLI uses a locally deployed signing service for secure private key management
- Sender address is automatically fetched from the signing service
- Unsigned transactions are built locally and submitted to the signing service for signing and broadcasting
- Signing service URL must be configured for all operations
- The signing service returns transaction hash upon successful submission

## Example Interactions

### Example 1: Simple CKB Transfer
**User**: "Send 100 CKB to ckb1abc..."

**Agent Actions**:
1. Parse: transfer CKB, amount=100, recipient=ckb1abc...
2. Verify signing service URL is configured
3. Execute: `rise transfer --to ckb1abc... --amount 100`
4. Parse output for transaction hash and fee
5. Respond: "✓ Sent 100 CKB to ckb1abc... Transaction hash: 0x... Fee: X CKB"

### Example 2: Transfer with Dry Run
**User**: "Estimate the fee for sending 1000 CKB to ckb1xyz..."

**Agent Actions**:
1. Parse: dry run, transfer CKB, amount=1000, recipient=ckb1xyz...
2. Execute: `rise transfer --to ckb1xyz... --amount 1000 --dry-run`
3. Parse estimated fee and cycles
4. Respond: "Estimated fee for sending 1000 CKB to ckb1xyz...: X CKB, Y cycles (this was a simulation, no transaction was sent)"

### Example 3: Configure Signing Service URL
**User**: "Set my signing service to http://127.0.0.1:18799"

**Agent Actions**:
1. Parse: set signing service URL, url=http://127.0.0.1:18799
2. Execute: `rise config set-sign-server-url http://127.0.0.1:18799`
3. Verify success
4. Respond: "✓ Signing service URL configured successfully. You can now use RISE CLI with your local signing service."

### Example 4: Missing Signing Service URL
**User**: "Send 50 CKB to ckb1def..."

**Agent Actions**:
1. Parse: transfer CKB, amount=50, recipient=ckb1def...
2. Execute: `rise transfer --to ckb1def... --amount 50`
3. Error: Signing service URL not set
4. Respond: "⚠ Signing service URL not configured. Please set it first using: `rise config set-sign-server-url <your-signing-service-url>`"

### Example 5: Add Contact to Address Book
**User**: "Add alice to my address book with address ckb1qyqgsm5fv7xqy8m4u9xv2kq8pqvxpkv3q8xc8kqyqgsm5fv7xqyq"

**Agent Actions**:
1. Parse: add contact, name=alice, address=ckb1qyqgsm5fv7xqy8m4u9xv2kq8pqvxpkv3q8xc8kqyqgsm5fv7xqyq
2. Execute: `rise address-book add alice ckb1qyqgsm5fv7xqy8m4u9xv2kq8pqvxpkv3q8xc8kqyqgsm5fv7xqyq`
3. Verify success
4. Respond: "✓ Added alice to address book with address ckb1qyqgsm5fv7xqy8m4u9xv2kq8pqvxpkv3q8xc8kqyqgsm5fv7xqyq"

### Example 6: List Address Book
**User**: "Show my contacts"

**Agent Actions**:
1. Parse: list contacts
2. Execute: `rise address-book list`
3. Parse output for contacts
4. Respond: "Your address book has 2 contacts:\n• alice: ckb1qyq...\n• bob: ckb1qzr..."

### Example 7: Transfer Using Contact Name
**User**: "Send 100 CKB to alice"

**Agent Actions**:
1. Parse: transfer, recipient=alice (contact name), amount=100
2. Execute: `rise transfer --to alice --amount 100`
3. CLI automatically resolves "alice" to the address from address book
4. Parse transaction hash and fee
5. Respond: "✓ Sent 100 CKB to alice (ckb1qyq...) Transaction hash: 0x... Fee: X CKB"

### Example 8: Update Contact Address
**User**: "Update bob's address to ckt1qyqtd7su6j50f2ce8psf4kv4qnk2zqvhw7f8sf8x3zd2p8k3x3h3dqvgrn7c38lg8mdnjlw7eh2q3hcnvslkzd5qcmmsye8q"

**Agent Actions**:
1. Parse: update contact, name=bob, new address=ckt1qyqtd7su6j50f2ce8psf4kv4qnk2zqvhw7f8sf8x3zd2p8k3x3h3dqvgrn7c38lg8mdnjlw7eh2q3hcnvslkzd5qcmmsye8q
2. Execute: `rise address-book update bob ckt1qyqtd7su6j50f2ce8psf4kv4qnk2zqvhw7f8sf8x3zd2p8k3x3h3dqvgrn7c38lg8mdnjlw7eh2q3hcnvslkzd5qcmmsye8q`
3. Verify success and show old/new address
4. Respond: "✓ Updated bob's address from ckb1qzr... to ckt1qyqtd7su6j50f2ce8psf4kv4qnk2zqvhw7f8sf8x3zd2p8k3x3h3dqvgrn7c38lg8mdnjlw7eh2q3hcnvslkzd5qcmmsye8q"

### Example 9: Remove Contact
**User**: "Remove charlie from my address book"

**Agent Actions**:
1. Parse: remove contact, name=charlie
2. Execute: `rise address-book remove charlie`
3. Verify success
4. Respond: "✓ Removed charlie from address book (address: ckb1abc...)"

### Example 10: Transfer with Non-existent Contact
**User**: "Send 50 CKB to dave"

**Agent Actions**:
1. Parse: transfer, recipient=dave (not found in address book)
2. CLI falls back to treating "dave" as a raw address
3. Execute: `rise transfer --to dave --amount 50`
4. Error: Invalid address format
5. Respond: "⚠ 'dave' is not in your address book and is not a valid CKB address. Please:\n1. Add dave to your address book first: `rise address-book add dave <address>`\n2. Or provide a valid CKB address starting with 'ckb1' or 'ckt1'"

## Common Patterns

### Pattern: Transfer with Confirmation
For large amounts, confirm before executing:
```
User: "Send 5000 CKB to ckb1abc..."
Agent: "You're about to send 5000 CKB to ckb1abc... This is a large amount. Confirm? (yes/no)"
User: "yes"
Agent: [Execute transfer]
```

### Pattern: Invalid Address
If address format is invalid:
```
User: "Send 100 CKB to bob"
Agent: "Invalid address format. Please provide a valid CKB address starting with 'ckb1' or a full hex address."
```

### Pattern: Missing Signing Service URL
If signing service URL is not configured:
```
User: "Send 50 CKB to ckb1xyz..."
Agent: [Check fails]
Agent: "⚠ Signing service URL not configured. Please set it using:
1. rise config set-sign-server-url <your-signing-service-url>
2. Or I can help you set it - what's your signing service URL?"
```

### Pattern: Add Contact Before Transfer
When user wants to send to a new address:
```
User: "Send 100 CKB to alice"
Agent: [Check address book, alice not found]
Agent: "alice is not in your address book. Would you like to add her first? I'll need her CKB address."
User: "Her address is ckb1qyq..."
Agent: [Execute: rise address-book add alice ckb1qyq...]
Agent: [Execute: rise transfer --to alice --amount 100]
Agent: "✓ Added alice to address book and sent 100 CKB successfully!"
```

### Pattern: List Before Transfer
When user wants to see available contacts:
```
User: "Who can I send to?"
Agent: [Execute: rise address-book list]
Agent: "Your address book contains:\n• alice: ckb1qyq...\n• bob: ckb1qzr...\n\nWho would you like to send CKB to?"
```

### Pattern: Contact Not Found
If contact name doesn't exist and is not a valid address:
```
User: "Send 50 CKB to unknown"
Agent: [Lookup fails, address validation fails]
Agent: "I couldn't find 'unknown' in your address book, and it's not a valid CKB address format.\n\nYou can:\n1. Add unknown as a contact: `rise address-book add unknown <address>`\n2. Check your contacts: `rise address-book list`\n3. Use a valid CKB address (starts with ckb1 or ckt1)"
```

### Pattern: Update Existing Contact
When user wants to change a contact's address:
```
User: "Alice changed her address, update it to ckt1qyq..."
Agent: [Execute: rise address-book update alice ckt1qyq...]
Agent: "✓ Updated alice's address from ckb1qyq... to ckt1qyq..."
```

### Pattern: Batch Operations
When user wants to manage multiple contacts:
```
User: "Add bob and charlie to my contacts"
Agent: "I'll need their addresses. What's bob's CKB address?"
User: "ckb1qzr... for bob"
Agent: [Execute: rise address-book add bob ckb1qzr...]
Agent: "✓ Added bob. What's charlie's address?"
User: "ckt1qyq... for charlie"
Agent: [Execute: rise address-book add charlie ckt1qyq...]
Agent: "✓ Added charlie. Your address book now has 2 contacts."
```

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
  - GET `/wallet/info` - Fetch current address, public key, and balance
  - POST `/transaction/submit` - Submit unsigned transaction for signing and broadcasting
- Balance validation is performed client-side before transaction building
- Transaction signing is performed by the local signing service
- CKB decimals: 8 (1 CKB = 100,000,000 Shannon)
