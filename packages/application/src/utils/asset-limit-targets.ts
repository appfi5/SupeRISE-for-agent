import type { AssetKind, ChainKind } from "@superise/domain";

export type PublicChain = "nervos" | "ethereum";

export type SupportedAssetLimitTarget = {
  chain: ChainKind;
  publicChain: PublicChain;
  asset: AssetKind;
  decimals: number;
};

export const SUPPORTED_ASSET_LIMIT_TARGETS: ReadonlyArray<SupportedAssetLimitTarget> = [
  {
    chain: "ckb",
    publicChain: "nervos",
    asset: "CKB",
    decimals: 8,
  },
  {
    chain: "evm",
    publicChain: "ethereum",
    asset: "ETH",
    decimals: 18,
  },
  {
    chain: "evm",
    publicChain: "ethereum",
    asset: "USDT",
    decimals: 6,
  },
  {
    chain: "evm",
    publicChain: "ethereum",
    asset: "USDC",
    decimals: 6,
  },
] as const;

export function toPublicChain(chain: ChainKind): PublicChain {
  return chain === "ckb" ? "nervos" : "ethereum";
}

export function fromPublicChain(chain: PublicChain): ChainKind {
  return chain === "nervos" ? "ckb" : "evm";
}

export function getSupportedAssetLimitTarget(
  chain: ChainKind,
  asset: AssetKind,
): SupportedAssetLimitTarget | null {
  return (
    SUPPORTED_ASSET_LIMIT_TARGETS.find(
      (target) => target.chain === chain && target.asset === asset,
    ) ?? null
  );
}

export function getSupportedAssetLimitTargetFromPublic(
  chain: PublicChain,
  asset: AssetKind,
): SupportedAssetLimitTarget | null {
  return (
    SUPPORTED_ASSET_LIMIT_TARGETS.find(
      (target) => target.publicChain === chain && target.asset === asset,
    ) ?? null
  );
}
