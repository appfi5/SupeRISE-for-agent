// Mock authentication state
export const mockAuth = {
  isLoggedIn: false,
  user: {
    email: "user@example.com",
    createdAt: "2025-01-15T10:30:00Z",
    name: "Demo User",
  },
};

// Mock API Keys
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  status: "active" | "disabled";
}

export const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production Key",
    key: "ocw_live_sk_1a2b3c4d5e6f7g8h9i0j",
    createdAt: "2025-01-20T08:00:00Z",
    status: "active",
  },
  {
    id: "2",
    name: "Test Key",
    key: "ocw_test_sk_9z8y7x6w5v4u3t2s1r0q",
    createdAt: "2025-02-01T14:30:00Z",
    status: "active",
  },
  {
    id: "3",
    name: "Old Key",
    key: "ocw_live_sk_0p9o8n7m6l5k4j3i2h1g",
    createdAt: "2024-12-10T09:00:00Z",
    status: "disabled",
  },
];

// Mock Wallets
export interface Wallet {
  id: string;
  address: string;
  chain: "Ethereum" | "Polygon" | "BSC" | "Solana";
  balance: string;
  status: "active" | "frozen";
  createdAt: string;
}

export const mockWallets: Wallet[] = [
  {
    id: "1",
    address: "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12",
    chain: "Ethereum",
    balance: "1.2345 ETH",
    status: "active",
    createdAt: "2025-01-20T08:00:00Z",
  },
  {
    id: "2",
    address: "0x9Z8y7X6w5V4u3T2s1R0qAbCdEf1234567890aBcD",
    chain: "Polygon",
    balance: "520.00 MATIC",
    status: "active",
    createdAt: "2025-01-25T10:00:00Z",
  },
  {
    id: "3",
    address: "0x0P9o8N7m6L5k4J3i2H1gAbCdEf1234567890aBcD",
    chain: "BSC",
    balance: "3.50 BNB",
    status: "frozen",
    createdAt: "2025-02-01T12:00:00Z",
  },
];

// Mock Transactions
export interface Transaction {
  id: string;
  walletId: string;
  type: "send" | "receive";
  amount: string;
  to: string;
  from: string;
  timestamp: string;
  status: "confirmed" | "pending";
}

export const mockTransactions: Transaction[] = [
  {
    id: "tx1",
    walletId: "1",
    type: "receive",
    amount: "0.5 ETH",
    from: "0xABC...123",
    to: "0x1a2...F12",
    timestamp: "2025-02-05T14:00:00Z",
    status: "confirmed",
  },
  {
    id: "tx2",
    walletId: "1",
    type: "send",
    amount: "0.1 ETH",
    from: "0x1a2...F12",
    to: "0xDEF...456",
    timestamp: "2025-02-06T09:30:00Z",
    status: "confirmed",
  },
  {
    id: "tx3",
    walletId: "1",
    type: "send",
    amount: "0.05 ETH",
    from: "0x1a2...F12",
    to: "0xGHI...789",
    timestamp: "2025-02-07T11:00:00Z",
    status: "pending",
  },
];

// Mock Wallet Rules
export interface WalletRule {
  walletId: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  enabled: boolean;
}

export const mockWalletRules: WalletRule[] = [
  {
    walletId: "1",
    dailyLimit: 0.5,
    monthlyLimit: 10,
    dailyUsed: 0.15,
    monthlyUsed: 2.3,
    enabled: true,
  },
  {
    walletId: "2",
    dailyLimit: 100,
    monthlyLimit: 2000,
    dailyUsed: 45,
    monthlyUsed: 680,
    enabled: true,
  },
  {
    walletId: "3",
    dailyLimit: 1,
    monthlyLimit: 20,
    dailyUsed: 0,
    monthlyUsed: 0,
    enabled: false,
  },
];
