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

  // ============================================================================
  // ETH / USDC signing types
  // ============================================================================

  /**
   * Unsigned ETH transaction payload sent to the sign server.
   *
   * All numeric fields (value, nonce, gasPrice, gasLimit) are hex strings
   * (with "0x" prefix). chainId is a plain integer.
   *
   * For a plain ETH transfer, set `data` to "0x".
   * For a USDC (ERC-20) transfer, encode the `transfer(address,uint256)` ABI
   * call and set it as `data`.
   */
  export interface EthUnsignedTransaction {
    /** Recipient address (ETH address, e.g. "0x…") */
    to: string;
    /** Transfer value in wei, hex string, e.g. "0xde0b6b3a7640000" for 1 ETH */
    value: string;
    /** ABI-encoded call data; "0x" for plain ETH transfers */
    data?: string;
    /** Sender nonce, hex string, e.g. "0x0" */
    nonce: string;
    /** Gas price in wei, hex string, e.g. "0x4a817c800" for 20 Gwei */
    gasPrice: string;
    /** Gas limit, hex string, e.g. "0x5208" for 21000 */
    gasLimit: string;
    /** Chain ID as integer (1 for Ethereum mainnet, 11155111 for Sepolia) */
    chainId: number;
  }

  /**
   * Response from POST /api/v1/agent/sign/sign-eth-transaction
   */
  export interface SignEthTransactionResponse {
    /** ETH address that signed the transaction */
    address: string;
    /** RLP-encoded signed transaction with "0x" prefix */
    signedTransaction: string;
    /** Keccak256 hash of the signed transaction */
    txHash: string;
  }

  export type SignEthTransactionServerResponse =
    SignServerResponseData<SignEthTransactionResponse>;
}
