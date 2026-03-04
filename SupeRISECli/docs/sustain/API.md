# SupeRISE Market Platform API Documentation

> Source: Feishu docs (synced 2026-03-02)
> Platform name: SupeRISE Market (superise-market)

## Overview

superise-market is an AI model proxy platform that provides two sets of APIs:

1. **Platform Management API** (`/api/v1/...`) — User management, API Key management, model queries, quotation queries
2. **OpenAI-Compatible API** (`/v1/...`) — Standard OpenAI protocol for model invocations

## Authentication

The platform uses two authentication mechanisms:

| Auth Type | Header | Scope |
|-----------|--------|-------|
| JWT Bearer Token | `Authorization: Bearer <accessToken>` | Platform Management API (obtained via login-for-agent) |
| API Key | `Authorization: Bearer <api_key>` | OpenAI-Compatible API (created via platform) |

## Common Response Structure

### ResponseData\<T\>

```typescript
{
  data: T;              // business data
  success: boolean;     // whether successful
  message: string;      // message
  code: number;         // status code (200 on success)
  errorData: unknown[]; // error details (optional)
}
```

### PagedData\<T\>

```typescript
{
  items: T[];           // current page data list
  total: number;        // total record count
  pageIndex: number;    // current page number
  pageSize: number;     // page size
}
```

---

## Platform Management API

### 🏷️ Users

#### POST /api/v1/user/gen-sign-message

Generate a message for signing. The client sends a CKB address to request a message to be signed.

- **Auth**: None required

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ckbAddress | string | ✅ | CKB address |

**Response**: `ResponseData<string>` (`data` is the message string to be signed)

---

#### POST /api/v1/user/login-for-agent

Agent login. Submit the signed message, public key, signature, and address to obtain a Token.

- **Auth**: None required

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ckbAddress | string | ✅ | CKB address |
| publicKey | string | | Public key |
| originMessage | string | | Original sign message (return value from gen-sign-message) |
| signature | string | | Signature result |

**Response**: `ResponseData<TokenVo>`

```typescript
type TokenVo = {
  accessToken: string;    // JWT Token
  refreshToken: string;   // Refresh Token
  expiresIn: string;      // Expiry time (seconds)
  scope: string;          // Permission scope
};
```

> **Note**: The old `POST /api/v1/user/login` (email/password) and `POST /api/v1/user/register` are marked as **deprecated**. Agents should use `login-for-agent`.

---

#### GET /api/v1/user/info

Query current logged-in user information.

- **Auth**: ✅ Bearer Token (accessToken)

**Request parameters**: None

**Response**: `ResponseData<UserInfoVo>`

```typescript
type UserInfoVo = {
  userId: string;      // GUID
  userName: string;
  email: string;
  ckbAddress: string;  // associated CKB address
  avatar: string;      // avatar URL
  isEnabled: boolean;
  balance: string;     // account balance (string, USD, e.g. "12.34")
};
```

> **Key field**: `balance` is the account balance (string format). In pay-per-use billing, this is the core metric for determining whether a top-up is needed. CLI internally uses `parseFloat()` to convert to number.

---

### 🏷️ ModelApiKeys

#### GET /api/v1/model-api-keys

Query all API Keys for the current user.

- **Auth**: ✅ Bearer Token

**Request parameters**: None

**Response**: `ResponseData<ModelApiKeyVo[]>`

```typescript
type ModelApiKeyVo = {
  id: string;          // GUID
  name: string;        // API Key name
  apiKey: string;      // API Key value (e.g. sk-abc123...)
  isRevoked: boolean;  // whether revoked
  createdAt: string;   // ISO 8601
};
```

---

#### POST /api/v1/model-api-keys/create

Create a new API Key.

- **Auth**: ✅ Bearer Token

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✅ | API Key name |

**Response**: `ResponseData<string>` (returns the new API Key ID)

---

#### POST /api/v1/model-api-keys/modify

Edit API Key name.

- **Auth**: ✅ Bearer Token

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (GUID) | ✅ | API Key ID |
| name | string | ✅ | New name |

**Response**: `ResponseData<boolean>`

---

#### POST /api/v1/model-api-keys/delete

Delete an API Key.

- **Auth**: ✅ Bearer Token

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (GUID) | ✅ | API Key ID |

**Response**: `ResponseData<boolean>`

---

### 🏷️ AIModels

#### GET /api/v1/ai-models

Query available AI model list (paginated).

- **Auth**: None required

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| pageIndex | integer | ✅ | Page number (starting from 1) |
| pageSize | integer | ✅ | Items per page |

**Response**: `ResponseData<PagedData<AiModelVo>>`

```typescript
type AiModelVo = {
  id: string;          // GUID
  name: string;        // Model name (e.g. "GPT-4o", "DeepSeek-V3")
  provider: string;    // Provider name (e.g. "OpenAI", "DeepSeek")
  version: string;     // Version
  scene: number;       // Use case (Scene enum)
  capability: string;  // Capability description
};
```

**Response example:**

```json
{
  "data": {
    "items": [
      {
        "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "GPT-4o",
        "provider": "OpenAI",
        "version": "2024-11-20",
        "scene": 1,
        "capability": "Powerful multimodal understanding and generation, supports text and image input"
      }
    ],
    "total": 2,
    "pageIndex": 1,
    "pageSize": 10
  },
  "success": true,
  "message": "",
  "code": 200,
  "errorData": null
}
```

---

#### POST /api/v1/ai-models/quotations

Query quotation list for a specific AI model (paginated).

- **Auth**: None required

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pageIndex | integer | ✅ | Page number |
| pageSize | integer | ✅ | Items per page |
| modelId | string (GUID) | ✅ | AI model ID |

**Response**: `ResponseData<PagedData<AiModelQuotationVo>>`

```typescript
type AiModelQuotationVo = {
  id: string;          // GUID (quotation ID)
  merchantId: string;  // GUID (merchant ID)
  modelId: string;     // GUID (associated model ID)
  price: number;       // quotation (long, smallest currency unit)
};
```

**Response example:**

```json
{
  "data": {
    "items": [
      {
        "id": "aa1bb2cc-3dd4-5ee6-ff78-990011223344",
        "merchantId": "ff001122-3344-5566-7788-99aabbccddee",
        "modelId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "price": 100
      },
      {
        "id": "bb2cc3dd-4ee5-6ff7-8899-001122334455",
        "merchantId": "ee991100-2233-4455-6677-8899aabbccdd",
        "modelId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "price": 120
      }
    ],
    "total": 2,
    "pageIndex": 1,
    "pageSize": 10
  },
  "success": true,
  "message": "",
  "code": 200,
  "errorData": null
}
```

---

## OpenAI-Compatible API

Authenticated via API Key (`Authorization: Bearer <api_key>`).

### GET /v1/models

Get available model list (compatible with OpenAI /v1/models).

**Response example:**

```json
{
  "object": "list",
  "data": [
    { "id": "gpt-4o", "object": "model", "created": 1740000000, "owned_by": "local" },
    { "id": "text-embedding-3-small", "object": "model", "created": 1740000000, "owned_by": "local" }
  ]
}
```

> **Important**: The model `id` here uses short names (e.g. `gpt-4o`), different from the GUIDs in the Platform Management API. OpenClaw should use this `id` as the model ref.

---

### POST /v1/chat/completions

Chat completion, supports streaming (SSE) output.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | ❌ | Model name; uses default if omitted |
| messages | array | ✅ | Message list |
| messages[].role | string | ✅ | Role: user / assistant / system |
| messages[].content | any | ✅ | Message content |
| temperature | float | ❌ | Temperature, default 1.0 |
| stream | boolean | ❌ | Whether to stream output, default false |

**Response includes `usage` field:**

```typescript
{
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

---

### POST /v1/completions

Text completion, supports streaming (SSE) output.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | ❌ | Model name |
| prompt | any | ✅ | Input text |
| temperature | float | ❌ | Temperature, default 1.0 |
| stream | boolean | ❌ | Whether to stream output, default false |

---

### POST /v1/embeddings

Text embedding.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | ❌ | Model name (prefer EmbeddingModel) |
| input | any | ✅ | Input text (string or string array) |

---

### POST /v1/responses

Responses API (compatible with OpenAI /v1/responses), **streaming not yet supported**.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | ❌ | Model name |
| input | any | ✅ | Input text |
| temperature | float | ❌ | Temperature, default 1.0 |
| stream | boolean | ❌ | Passing true returns 501 |

---

### OpenAI-Compatible API Error Format

```json
{
  "error": {
    "message": "Error message",
    "type": "invalid_request_error | authentication_error",
    "param": "field_name",
    "code": "error_code"
  }
}
```

---

## Business Model Summary

### Billing Model

- **Pay-per-use**: User accounts have a `balance`, each API call deducts based on actual usage
- **No subscription/plans**: No plan-based renewal; top-up is needed when balance is insufficient
- **Balance query**: Obtain `balance` field via `GET /api/v1/user/info`

### Models and Suppliers

- **Model catalog**: `GET /api/v1/ai-models` returns available platform models
- **Multi-supplier quotations**: Each model has quotations from multiple merchants (`POST /api/v1/ai-models/quotations`)
- **Supplier selection**: Determined automatically by the platform; users can influence selection by setting price ranges when creating API Keys
- **OpenAI-compatible**: Actual calls go through `/v1/chat/completions` and other standard OpenAI protocol endpoints

### Two Model Identifier Systems

| Source | ID Format | Example |
|--------|-----------|---------|
| Platform Management API (`/api/v1/ai-models`) | GUID | `1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d` |
| OpenAI-Compatible API (`/v1/models`) | Short name | `gpt-4o` |

OpenClaw model ref uses the OpenAI-compatible API short name format: `openrouter/<model-short-name>`

### 🏷️ Orders (Top-up Orders)

#### POST /api/v1/order/create

Create a top-up order. User/Agent initiates an on-chain top-up; the platform returns a receiving address and estimated credited amount.

- **Auth**: ✅ Bearer Token

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fromAddress | string | ✅ | User's payment wallet address |
| currencyType | integer | ✅ | Currency enum value (see table below) |
| amount | number | ✅ | Top-up amount (actual on-chain transfer amount) |

**CurrencyType enum:**

| Value | Name | Description |
|-------|------|-------------|
| 0 | Unknown | Unknown |
| 1 | Btc | Bitcoin |
| 2 | Ckb | Nervos CKB |
| 3 | Usdi | USDI |
| 4 | Eth | Ethereum |
| 5 | Usdc | USD Coin |
| 6 | Usdt | Tether USDT |

**Response**: `ResponseData<CreateOrderVo>`

```typescript
type CreateOrderVo = {
  id: string;              // UUID (order ID)
  toAddress: string;       // platform receiving address (user must transfer to this address)
  currencyType: number;    // currency enum value
  exchangeAmount: string;  // estimated credited amount (USD), 6 decimal precision
};
```

**Response example:**

```json
{
  "success": true,
  "message": "",
  "code": 200,
  "data": {
    "id": "019587ab-1234-7abc-8def-0123456789ab",
    "toAddress": "ckb1qzda0cr08m85hc8jlnfp3sdrpwd4kxq4ywjxwzaajz7vrdqerxs4qkxkvhw",
    "currencyType": 2,
    "exchangeAmount": "12.345678"
  },
  "errorData": null
}
```

---

#### POST /api/v1/order/submit-tx-hash

After the user completes the on-chain transfer, submit the transaction hash to the platform for on-chain confirmation monitoring.

- **Auth**: ✅ Bearer Token

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string (UUID) | ✅ | Order ID, returned by the create order endpoint |
| txHash | string | ✅ | On-chain transaction hash, 0x-prefixed hex string |

**Request example:**

```json
{
  "orderId": "019587ab-1234-7abc-8def-0123456789ab",
  "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

**Response**: `ResponseData<boolean>`

```json
{
  "success": true,
  "message": "",
  "code": 200,
  "data": true,
  "errorData": null
}
```

**Error responses:**

- `400 Bad Request`: Parameter validation failed / transaction hash format error
- `404 Not Found`: Order does not exist / unauthorized access

---

#### Top-up Business Flow

```
1. Create Order
   POST /api/v1/order/create
   ├─ Request: fromAddress + currencyType + amount
   └─ Response: orderId + toAddress (platform receiving address) + exchangeAmount (estimated USD credit)

         ↓ User initiates on-chain transfer to toAddress

2. Submit Transaction Hash
   POST /api/v1/order/submit-tx-hash
   ├─ Request: orderId + txHash (on-chain transaction hash)
   └─ Response: true (platform starts monitoring on-chain confirmation)

         ↓ Platform monitors on-chain confirmation, auto-updates order status and credits balance
```

---

### Pending / Upcoming APIs

| Feature | Status | Description |
|---------|--------|-------------|
| Top-up | ✅ Available | Via Orders API (create order + submit tx) |
| Usage details | Not available | Query consumption details by time range |
| Token refresh | Not available | How to use `refreshToken` |
| Price range config | ✅ Available | `POST /api/v1/model-api-keys/set-price-range` |
