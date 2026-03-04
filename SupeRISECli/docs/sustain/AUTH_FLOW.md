# SupeRISE Market Authentication Flow

## Overview

SupeRISE Market uses a CKB address-based authentication mechanism with signature verification to ensure user identity authenticity.

Authentication involves two services:
- **Market Platform** — Generates sign messages, handles login, management API
- **Sign Server (local)** — Provides wallet address and message signing

## Authentication Flow

### 1. Identity

Uses the CKB address as the user's unique identifier. The address is obtained from Sign Server's key-config:

```
GET /api/v1/agent/key-config/list   (Sign Server)
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "addressType": 2,
      "address": "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xws...",
      "publicKey": "0x02A584BEED7564E8867F5E1A2B3D511968993451EF76962DC8ED2385DB2D8AB631"
    }
  ]
}
```

Use `data[0]` as the current wallet. Equivalent CLI command: `rise whoami --json`.

### 2. Authentication Steps

#### 2.1 Generate Sign Message (gen-sign-message)

Client requests a message to be signed from the Market platform:

```
POST /api/v1/user/gen-sign-message   (Market)
Content-Type: application/json

{
  "ckbAddress": "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xws..."
}
```

Response (`data` is a string directly):
```json
{
  "success": true,
  "data": "Sign this message to authenticate: timestamp=1234567890"
}
```

#### 2.2 Sign Message (signMessage)

Use Sign Server to sign the message:

```
POST /api/v1/agent/sign/sign-message   (Sign Server)
Content-Type: application/json

{
  "address": "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xws...",
  "message": "Sign this message to authenticate: timestamp=1234567890"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "address": "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xws...",
    "signature": "0xaaaa...aaaa"
  }
}
```

#### 2.3 Login to Get Token (login-for-agent)

Submit the original message, public key, signature, and address to the Agent login API:

```
POST /api/v1/user/login-for-agent   (Market)
Content-Type: application/json

{
  "ckbAddress": "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xws...",
  "publicKey": "0x02A584BEED7564E8867F5E1A2B3D511968993451EF76962DC8ED2385DB2D8AB631",
  "originMessage": "Sign this message to authenticate: timestamp=1234567890",
  "signature": "0xaaaa...aaaa"
}
```

Response (TokenVo):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "86400",
    "scope": "user"
  }
}
```

#### 2.4 Token Storage

`accessToken` and `refreshToken` are stored in the local filesystem:

- Path: `~/.rise/market-session.json`
- Format:
```json
{
  "address": "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xws...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1741186800000
}
```

### 3. API Call Authentication

#### JWT Bearer Token (Platform Management API)

The following APIs require a JWT Bearer Token (`accessToken`) in the request header:

- `GET /api/v1/user/info` — Get user info and balance
- `GET /api/v1/model-api-keys` — Get API Key list
- `POST /api/v1/order/create` — Create top-up order
- `POST /api/v1/order/submit-tx-hash` — Submit transaction hash (`txHash`)

Request example:
```
GET /api/v1/user/info
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Key (OpenAI-Compatible API)

The following APIs use API Key authentication (obtained from `GET /api/v1/model-api-keys`):

- `GET /v1/models` — OpenAI-compatible model list
- `POST /v1/chat/completions` — OpenAI Chat API

Request example:
```
GET /v1/models
Authorization: Bearer sk-xxxxxxxxxxxx
```

#### APIs Requiring No Authentication

- `GET /api/v1/ai-models` — Get model list (paginated)
- `POST /api/v1/ai-models/quotations` — Get model quotations (paginated)
- `POST /api/v1/user/gen-sign-message` — Generate sign message

### 4. Token Validation and Refresh

The client automatically checks the Token before calling APIs that require authentication:

1. Check if a local Token exists
2. Check if the Token has expired (based on `expiresAt`)
3. Check if the current address matches the address associated with the Token
4. If the Token is invalid or missing, automatically execute the full authentication flow

Code example:
```typescript
const auth = getAuthService();
const token = await auth.ensureToken(); // automatically handles authentication

// Use token to call API
const response = await fetch(`${baseUrl}/api/v1/user/info`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 5. Logout

Clear locally stored Token:

```typescript
const auth = getAuthService();
auth.logout();
```

This deletes the `~/.rise/market-session.json` file and cached API Key.

## Implementation Details

### Auth Service Interface

```typescript
export interface PlatformAuthService {
  ensureToken(): Promise<string>;
  ensureApiKey(): Promise<string>;
  getAddress(): Promise<string>;
  logout(): void;
  isTokenValid(): boolean;
}
```

### Authentication Flow Automation

In the client code, all operations requiring authentication automatically call `ensureToken()`, which:

1. Checks if the local Token is valid
2. If invalid, automatically executes the full authentication flow:
   - Get wallet address and public key from Sign Server
   - Request sign message from Market (gen-sign-message)
   - Sign message via Sign Server (sign-message)
   - Login to Market (login-for-agent)
   - Save accessToken and refreshToken
3. Returns a valid accessToken

Users do not need to manually handle the authentication process.

## Security Considerations

1. **Token storage**: Tokens are stored in the local filesystem; permissions should be set to current-user-only read access
2. **Signature verification**: Server validates signature authenticity, ensuring requests come from the actual address holder
3. **Message uniqueness**: Sign messages include timestamps to prevent replay attacks
4. **Token expiry**: accessToken has an expiry time (`expiresIn` seconds); automatically re-authenticates after expiry

## Related Files

- `src/services/platform-auth.ts` — Auth service implementation (CKBAuthService)
- `src/services/sign-server.ts` — Sign Server API calls (signMessage, getWallet)
- `src/services/superise-market.ts` — Market client (uses auth service)
- `src/services/platform-types.ts` — Platform API type definitions
- `~/.rise/market-session.json` — Token storage file
- `docs/sustain/swagger.json` — Market API specification
- `docs/local-server-swagger.json` — Sign Server API specification
