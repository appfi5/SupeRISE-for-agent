import { collectVersions, getRootPackageJsonPath, getRootVersion } from "./version-lib.mjs";

const rootVersion = getRootVersion();
const rootPath = getRootPackageJsonPath();
const mismatches = [];

for (const [path, version] of collectVersions()) {
  if (version !== rootVersion) {
    mismatches.push({ path, version });
  }
}

if (mismatches.length > 0) {
  process.stderr.write(`Version mismatch detected. Root package ${rootPath} uses ${rootVersion}.\n`);
  for (const mismatch of mismatches) {
    process.stderr.write(`- ${mismatch.path}: ${mismatch.version}\n`);
  }
  process.exit(1);
}

process.stdout.write(`All package versions are aligned at ${rootVersion}.\n`);
