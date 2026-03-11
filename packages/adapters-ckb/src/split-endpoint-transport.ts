type JsonRpcPayload = {
  id: number;
  jsonrpc: "2.0";
  method: string;
  params: unknown[] | Record<string, unknown>;
};

const INDEXER_METHODS = new Set([
  "get_cells",
  "get_transactions",
  "get_cells_capacity",
]);

export class CkbSplitEndpointTransport {
  constructor(
    private readonly rpcUrl: string,
    private readonly indexerUrl: string,
  ) {}

  async request(payload: JsonRpcPayload): Promise<unknown> {
    const url = INDEXER_METHODS.has(payload.method)
      ? this.indexerUrl
      : this.rpcUrl;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }
}
