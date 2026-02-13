import { ccc } from "@ckb-ccc/shell";
import { getConfig } from "../utils/config.js";

export function createClient(): ccc.ClientPublicTestnet {
  const { rpc, indexer } = getConfig();
  const baseUrl = indexer || rpc;
  const fallbacks = [indexer, rpc].filter(Boolean);
  return new ccc.ClientPublicTestnet({
    url: baseUrl,
    fallbacks,
  });
}

export function createSigner(
  client: ccc.ClientPublicTestnet,
  privateKey: string,
): ccc.SignerCkbPrivateKey {
  return new ccc.SignerCkbPrivateKey(client, privateKey);
}
