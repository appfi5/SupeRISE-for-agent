# SupeRISE for agent

A secure CKB blockchain wallet with local signer server integration for safe private key management.

## Architecture

![System Architecture](doc/picture/architecture.jpg)

## Project Overview

SupeRISELocalServer consists of two main components:

- **SupeRISELocalServer**: Local signer server (.NET) that securely manages private keys and signing operations
- **SupeRISELocalCli**: Command-line interface (Bun/TypeScript) providing user-friendly interactions

## Features

- **Secure Key Management**: Local signer server ensures private keys remain secure; CLI never touches private keys
- **CLI Operations**: Simple and intuitive CKB transfer commands
- **Address Book**: Save and manage contacts with CKB addresses
- **Configurable**: Custom fee rates and network settings
- **Dry Run**: Estimate fees without executing actual transactions
- **Testnet Ready**: Optimized for CKB testnet operations

## Quick Start

For detailed setup instructions, see [SKILL.md](SKILL.md).

Quick overview:

1. Install and run the signer server
2. Build and install the CLI
3. Configure the CLI to connect to the signer server

## Usage

For detailed command reference and usage examples, see [SKILL.md](SKILL.md).

Quick examples:

```bash
# Transfer CKB
rise transfer --to ckb1qy... --amount 100

# Address book operations
rise address-book add alice ckb1qy...
rise address-book list

# Configuration
rise config show
rise config set-fee-rate 1500
```

## License

MIT

## Related Links

- [CKB Blockchain](https://www.nervos.org/)
- [CCC SDK](https://github.com/xxuejie/ccc-cli)
- [CKB Testnet](https://testnet.ckb.dev/)
