// CKB Explorer API service for address balance queries
const EXPLORER_API_BASE_URL = "https://testnet-api.explorer.nervos.org/api/v1";

// CKB Explorer API response following JSON API specification
interface ExplorerAddressResponse {
  data: Array<{
    type: string;
    attributes: {
      balance: string; // Balance in shannon
      transactions_count: string;
      dao_deposit: string;
      live_cells_count: string;
      balance_occupied: string;
      address_hash: string;
      lock_script: {
        args: string;
        code_hash: string;
        hash_type: string;
        verified_script_name: string;
        tags: string[];
      };
    };
  }>;
}

/**
 * Get the balance of a CKB address from CKB Explorer API
 * @param address - CKB address to query
 * @returns Balance in shannon as a string
 * @throws Error if API request fails or address not found
 */
export async function getAddressBalance(address: string): Promise<string> {
  const url = `${EXPLORER_API_BASE_URL}/addresses/${encodeURIComponent(address)}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(
      `Explorer API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json() as ExplorerAddressResponse;

  if (!data.data || data.data.length === 0) {
    throw new Error(`Address not found: ${address}`);
  }

  return data.data[0].attributes.balance;
}
