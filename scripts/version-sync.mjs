import { getRootVersion, setWorkspaceVersions } from "./version-lib.mjs";

const rootVersion = getRootVersion();
setWorkspaceVersions(rootVersion);

process.stdout.write(`Synchronized workspace package versions to ${rootVersion}.\n`);
