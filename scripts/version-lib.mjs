import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const ROOT_PACKAGE_JSON_PATH = join(ROOT_DIR, "package.json");
const WORKSPACE_ROOTS = ["apps", "packages"];

const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function assertVersion(value) {
  if (!SEMVER_PATTERN.test(value)) {
    throw new Error(
      `Unsupported version "${value}". Expected a semantic version like 1.2.3 or 1.2.3-rc.1.`,
    );
  }
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function getRootPackageJsonPath() {
  return ROOT_PACKAGE_JSON_PATH;
}

export function getRootVersion() {
  const rootPackage = readJson(ROOT_PACKAGE_JSON_PATH);
  return rootPackage.version;
}

export function setRootVersion(version) {
  assertVersion(version);
  const rootPackage = readJson(ROOT_PACKAGE_JSON_PATH);
  rootPackage.version = version;
  writeJson(ROOT_PACKAGE_JSON_PATH, rootPackage);
}

export function getWorkspacePackageJsonPaths() {
  return WORKSPACE_ROOTS.flatMap((workspaceRoot) => {
    const directoryPath = join(ROOT_DIR, workspaceRoot);

    return readdirSync(directoryPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(directoryPath, entry.name, "package.json"));
  });
}

export function setWorkspaceVersions(version) {
  assertVersion(version);

  for (const packageJsonPath of getWorkspacePackageJsonPaths()) {
    const packageJson = readJson(packageJsonPath);
    packageJson.version = version;
    writeJson(packageJsonPath, packageJson);
  }
}

export function collectVersions() {
  const versions = new Map();
  versions.set(ROOT_PACKAGE_JSON_PATH, getRootVersion());

  for (const packageJsonPath of getWorkspacePackageJsonPaths()) {
    const packageJson = readJson(packageJsonPath);
    versions.set(packageJsonPath, packageJson.version);
  }

  return versions;
}
