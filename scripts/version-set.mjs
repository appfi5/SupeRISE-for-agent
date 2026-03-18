import { setRootVersion, setWorkspaceVersions } from "./version-lib.mjs";

const nextVersion = process.argv[2];

if (!nextVersion) {
  process.stderr.write("Usage: node scripts/version-set.mjs <version>\n");
  process.exit(1);
}

setRootVersion(nextVersion);
setWorkspaceVersions(nextVersion);

process.stdout.write(`Set root and workspace package versions to ${nextVersion}.\n`);
