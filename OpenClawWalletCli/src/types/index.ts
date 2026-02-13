export type RiseConfig = {
  rpc: string;
  indexer: string;
  apiKey?: string;
  feeRate: number | null;
  addressBook?: Record<string, string>;
  signServerUrl?: string;
};

// ============================================================================
// Sign Server API Types
// Based on OpenClawWalletServer Swagger v1
// ============================================================================

export namespace SignService {
  export enum AddressType {
    Unknown = 0,
    Eth = 1,
    Ckb = 2,
  }

  export interface SignServerRequest {
    address: string;
    content: string;
  }

  export interface SignServerResponse {
    address: string;
    content: string;
  }

  export interface KeyConfigListItem {
    addressType: AddressType;
    address: string;
    publicKey: string;
  }

  export interface SignServerResponseData<T> {
    success: boolean;
    message: string;
    code: number;
    data: T | null;
    errorData: unknown[] | null;
  }

  export type SignCkbTransactionResponse = SignServerResponseData<SignServerResponse>;
  export type KeyConfigListResponse = SignServerResponseData<KeyConfigListItem[]>;
}


