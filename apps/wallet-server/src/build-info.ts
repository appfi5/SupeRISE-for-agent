import { APP_VERSION } from "./version";

type Environment = Record<string, string | undefined>;

export type BuildInfo = {
  appVersion: string;
  buildRef: string | null;
  gitSha: string | null;
  builtAt: string | null;
  deployImageTag: string | null;
  deployImageDigest: string | null;
};

function normalizeOptionalString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

export function resolveBuildInfo(env: Environment = process.env): BuildInfo {
  return {
    appVersion: APP_VERSION,
    buildRef: normalizeOptionalString(env.SUPERISE_BUILD_REF),
    gitSha: normalizeOptionalString(env.SUPERISE_GIT_SHA),
    builtAt: normalizeOptionalString(env.SUPERISE_BUILT_AT),
    deployImageTag: normalizeOptionalString(env.SUPERISE_DEPLOY_IMAGE_TAG),
    deployImageDigest: normalizeOptionalString(env.SUPERISE_DEPLOY_IMAGE_DIGEST),
  };
}

export const BUILD_INFO = resolveBuildInfo();
