# Build Guide

## Build Commands

### Compile to Binary (Recommended)

```bash
bun run build:bin
# Output: bin/rise (executable with embedded SQLite)
```

### Bundle to JS (Requires Bun Runtime)

```bash
bun run build
# Output: bin/rise.js
# Run: node bin/rise.js <command>
```

**Note**: Sustain uses a SQLite database. The compiled binary is recommended.

### Development Mode

```bash
bun run dev
# Runs src/index.ts directly, no build required
```

## Local Testing

The project does not use mocks or build-time mode switching. Testing is done via a **local test server** + **config switching**.

### Start Test Server

```bash
bun run test-server
# Listens on http://localhost:3939 by default
# Simulates Market platform API and Sign Server
```

### Point CLI to Test Server

```bash
# Set platform API URL
rise sustain config set platformBaseUrl http://localhost:3939

# Set Sign Server URL
rise config set-sign-server-url http://localhost:3939
```

### Restore Production Config

```bash
rise sustain config set platformBaseUrl https://superise-market.superise.net
# Or reset all config
rise sustain config reset --confirm
```

### Test Server Capabilities

The test server simulates the following APIs:

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/user/gen-sign-message` | Generate sign message |
| `POST /api/v1/user/login-for-agent` | Agent login, returns accessToken |
| `GET /api/v1/user/info` | User info + balance |
| `GET /api/v1/model-api-keys` | API Key list |
| `GET /api/v1/ai-models` | Model catalog |
| `POST /api/v1/ai-models/quotations` | Model quotations |
| `GET /v1/models` | OpenAI-compatible model list |
| `POST /api/v1/order/create` | Create top-up order |
| `POST /api/v1/order/submit-tx-hash` | Submit transaction hash |
| `POST /api/v1/agent/sign/sign-message` | Message signing |
| `POST /api/v1/agent/sign/sign-ckb-transaction` | CKB transaction signing |
| `GET /api/v1/agent/key-config/list` | Wallet key config |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPERISE_MARKET_BASE_URL` | Platform API URL (env-level override) | — |
| `SUSTAIN_CRON_MODE` | Cron mode (`dev` / `production`) | `production` |
| `RISE_HOME` | CLI data directory | `~/.rise` |
| `TEST_SERVER_PORT` | Test server port | `3939` |

## Deployment

```bash
# Build
bun run build:bin

# Deploy bin/rise to target machine
# Run setup
rise sustain setup
```

## CI/CD Example

```yaml
name: Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build:bin
      - uses: actions/upload-artifact@v3
        with:
          name: rise
          path: bin/rise
```
