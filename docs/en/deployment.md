# Deployment

This document describes deployment modes, configuration, startup flow, health checks, logging, backup, and recovery.

The default Chinese version is available at [docs/deployment.md](../deployment.md).

## Supported Deployment Modes

### `docker run` quickstart

This is the default profile of the official image.

Characteristics:

- direct `docker run` on the same official image
- zero-config first boot
- runtime secrets are generated on the first start
- both chains stay on the built-in `testnet` preset

Minimal accessible example:

```bash
docker run -p 18799:18799 <official-image>
```

After the first boot, `/app/runtime-data` contains:

- the SQLite database
- `/app/runtime-data/secrets/wallet.kek`
- `/app/runtime-data/secrets/owner-jwt.secret`
- `/app/runtime-data/owner-credential.txt`

Notes:

- quickstart guarantees zero-config startup, not zero-argument host accessibility
- without `-p`, the container still initializes, but the host cannot reach the service directly
- the initial Owner password is printed only once on the first boot

### `docker-compose` managed

This is the repository-provided controlled deployment mode.

Characteristics:

- still the same image, but explicitly fixed to `DEPLOYMENT_PROFILE=managed`
- `KEK` is provided through `docker secret`
- Owner JWT secret is provided explicitly by deployment config

Files provided in the repository:

- root [Dockerfile](../../Dockerfile)
- root [docker-compose.yml](../../docker-compose.yml)
- startup script [docker-up.sh](../../scripts/docker-up.sh)
- `KEK` rotation script [docker-rotate-kek.sh](../../scripts/docker-rotate-kek.sh)
- deployment env example [deploy/docker/.env.example](../../deploy/docker/.env.example)
- Docker custom chain config examples [deploy/docker/chain-config](../../deploy/docker/chain-config)

Startup command:

```bash
pnpm docker:up
```

After startup, you can check:

- Service URL: `http://127.0.0.1:${PORT:-18799}/`
- MCP endpoint: `http://127.0.0.1:${PORT:-18799}/mcp`
- Health check: `http://127.0.0.1:${PORT:-18799}/health`
- SQLite database: `deploy/docker/runtime-data/wallet.sqlite`

Notes:

- `docker-compose` starts with `NODE_ENV=production`
- `docker-compose` explicitly fixes `DEPLOYMENT_PROFILE=managed` in the compose file
- `docker-compose` binds only to the local loopback address by default through `PUBLISH_HOST=127.0.0.1`
- `ENABLE_API_DOCS` defaults to `false`
- `/docs` and `/docs-json` are disabled by default in deployment
- `deploy/docker/chain-config` is mounted read-only at `/app/chain-config`
- `/mcp` is unauthenticated and must not be exposed to the public Internet or to untrusted networks

### non-docker

Supported:

- `systemd`
- `pm2`
- manual process startup

Requirement:

- set `DEPLOYMENT_PROFILE=managed` explicitly whenever possible
- `WALLET_KEK_PATH` must be provided, or `WALLET_KEK` must be explicitly allowed
- `OWNER_JWT_SECRET` must be provided explicitly

## Core Configuration

Recommended configuration items:

- `NODE_ENV`
- `DEPLOYMENT_PROFILE`
- `ENABLE_API_DOCS`
- `PUBLISH_HOST`
- `HOST`
- `PORT`
- `DATA_DIR`
- `RUNTIME_SECRET_DIR`
- `SQLITE_PATH`
- `WALLET_KEK_PATH`
- `WALLET_KEK`
- `ALLOW_PLAINTEXT_KEK_ENV`
- `TRANSFER_SETTLEMENT_INTERVAL_MS`
- `TRANSFER_RESERVED_TIMEOUT_MS`
- `TRANSFER_SUBMITTED_TIMEOUT_MS`
- `CKB_CHAIN_MODE`
- `CKB_CHAIN_PRESET`
- `CKB_CHAIN_CONFIG_PATH`
- `EVM_CHAIN_MODE`
- `EVM_CHAIN_PRESET`
- `EVM_CHAIN_CONFIG_PATH`

Additional notes:

- `DEPLOYMENT_PROFILE=quickstart` rejects external `WALLET_KEK_PATH`, `WALLET_KEK`, and `OWNER_JWT_SECRET`
- `DEPLOYMENT_PROFILE=quickstart` only allows the built-in `testnet` preset on both chains
- `DEPLOYMENT_PROFILE=managed` fails fast when an external `KEK` or `OWNER_JWT_SECRET` is missing
- Swagger is enabled if and only if `ENABLE_API_DOCS=true`
- when the variable is missing, it is treated as `false`
- `PUBLISH_HOST` controls which host address Docker publishes the port on, with `127.0.0.1` as the default
- `pnpm docker:up` auto-generates the high-entropy JWT signing secret required by the local management surface when it creates `deploy/docker/.env` for the first time
- `TRANSFER_SETTLEMENT_INTERVAL_MS`, `TRANSFER_RESERVED_TIMEOUT_MS`, and `TRANSFER_SUBMITTED_TIMEOUT_MS` together control background transfer-settlement polling and timeout decisions
- `CKB` and `EVM` choose `preset|custom` independently
- `preset` uses built-in `testnet|mainnet` profiles
- `custom` loads a dedicated JSON file per chain
- `EVM custom` must provide both `tokens.erc20.usdt` and `tokens.erc20.usdc`

`CKB custom` example:

```json
{
  "rpcUrl": "https://testnet.ckb.dev",
  "indexerUrl": "https://testnet.ckb.dev/indexer",
  "genesisHash": "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
  "addressPrefix": "ckt",
  "scripts": {
    "Secp256k1Blake160": {
      "codeHash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      "hashType": "type",
      "cellDeps": [
        {
          "cellDep": {
            "outPoint": {
              "txHash": "0x71a7ba8f0f0c92bfbf76d5e3ef0b75ab6b2df95d060c5bc3d2dfb3b9f4f7c452",
              "index": 0
            },
            "depType": "depGroup"
          }
        }
      ]
    }
  }
}
```

`EVM custom` example:

```json
{
  "rpcUrl": "https://ethereum-sepolia-rpc.publicnode.com",
  "chainId": 11155111,
  "networkName": "custom-sepolia",
  "tokens": {
    "erc20": {
      "usdt": {
        "standard": "erc20",
        "contractAddress": "0x0cF531D755F7324B910879b3Cf7beDFAb872513E"
      },
      "usdc": {
        "standard": "erc20",
        "contractAddress": "0xa704C2f31628ec73A12704fa726a1806613a30ae"
      }
    }
  }
}
```

## Startup Flow

1. load base env configuration
2. resolve `DEPLOYMENT_PROFILE`
3. resolve `MODE/PRESET/CONFIG_PATH` independently for `CKB` and `EVM`
4. load and validate custom JSON files when a chain uses `custom`
5. read or generate runtime secrets according to `DEPLOYMENT_PROFILE`
6. initialize SQLite and run migrations
7. run startup self-checks for database, CKB, EVM, and the configured `USDT` / `USDC` contracts
8. ensure wallet
9. ensure the Owner local-management credential notice
10. print the one-time Owner quickstart notice when this is the first quickstart boot
11. start MCP and HTTP services
12. start background transfer-settlement polling

## Health Checks

Startup checks include:

- `managed` `KEK` availability
- `quickstart` runtime-secret directory writability plus secret generation / loading
- SQLite availability
- CKB RPC availability
- EVM RPC availability
- EVM `chainId` validation
- USDT contract address/code/`decimals()` validation
- USDC contract address/code/`decimals()` validation

When `CKB_CHAIN_MODE=custom`, startup also validates the actual CKB `genesisHash`.

Runtime `/health` performs a database availability check and returns `checks.database`.
Background transfer settlement keeps polling according to `TRANSFER_SETTLEMENT_INTERVAL_MS`.

## KEK Rotation

`KEK` rotation is not a regular UI capability, but it remains an operational procedure.

Current Docker flow:

1. Run `pnpm docker:rotate-kek`
2. The script stops `wallet-server`
3. A one-shot container runs [rewrap-kek.cjs](../../apps/wallet-server/scripts/rewrap-kek.cjs)
4. The old `KEK` is backed up and the new `KEK` becomes the active `docker secret`
5. `wallet-server` starts again

If you want to provide the next `KEK` file directly:

```bash
sh scripts/docker-rotate-kek.sh /absolute/path/to/next-wallet-kek.txt
```

## Quickstart-To-Managed Handoff

Recommended steps:

1. stop the current quickstart container while preserving the same runtime volume
2. choose the takeover strategy: reuse `/app/runtime-data/secrets/wallet.kek`, or prepare a new external `KEK`
3. if you need a new external `KEK`, re-wrap the current `DEK` with [rewrap-kek.cjs](../../apps/wallet-server/scripts/rewrap-kek.cjs) first
4. prepare the managed external `KEK` and `OWNER_JWT_SECRET`
5. restart the same image with the same data directory and `DEPLOYMENT_PROFILE=managed`

Principles:

- this is an explicit operational migration, not an automatic in-app switch
- if takeover fails, keep the original quickstart runtime data intact and avoid half-switched state

## Backup And Restore

You must back up:

- SQLite database
- the managed `KEK` source
- the quickstart runtime-secret directory

When `CKB_CHAIN_MODE=custom`, you must also back up the JSON file referenced by `CKB_CHAIN_CONFIG_PATH`.

When `EVM_CHAIN_MODE=custom`, you must also back up the JSON file referenced by `EVM_CHAIN_CONFIG_PATH`.
