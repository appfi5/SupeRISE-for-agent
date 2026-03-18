import { readFileSync } from "node:fs";
import { join } from "node:path";

type PackageJson = {
  version: string;
};

function readPackageVersion(): string {
  const packageJsonPath = join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
  return packageJson.version;
}

export const APP_VERSION = readPackageVersion();
