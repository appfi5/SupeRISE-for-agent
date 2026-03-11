const { spawn } = require("node:child_process");
const { resolve, relative } = require("node:path");
const chokidar = require("chokidar");

const workspaceRoot = resolve(__dirname, "../../..");
const serverCwd = resolve(__dirname, "..");
const watchPaths = [
  resolve(serverCwd, "src"),
  resolve(workspaceRoot, "packages/shared/dist"),
  resolve(workspaceRoot, "packages/app-contracts/dist"),
  resolve(workspaceRoot, "packages/domain/dist"),
  resolve(workspaceRoot, "packages/application/dist"),
  resolve(workspaceRoot, "packages/infrastructure/dist"),
  resolve(workspaceRoot, "packages/adapters-ckb/dist"),
  resolve(workspaceRoot, "packages/adapters-evm/dist"),
];

let childProcess = null;
let pendingRestart = null;
let shuttingDown = false;
const serverSourcePath = resolve(serverCwd, "src");

function startServer() {
  childProcess = spawn(
    process.execPath,
    [
      "--env-file-if-exists=.env",
      "-r",
      "ts-node/register/transpile-only",
      "src/main.ts",
    ],
    {
      cwd: serverCwd,
      stdio: "inherit",
      env: {
        ...process.env,
        TS_NODE_PROJECT: "tsconfig.build.json",
      },
    },
  );

  childProcess.on("exit", () => {
    childProcess = null;
  });
}

function restartServer(changedPath) {
  if (shuttingDown) {
    return;
  }

  if (pendingRestart) {
    clearTimeout(pendingRestart);
  }

  pendingRestart = setTimeout(() => {
    pendingRestart = null;
    const reason = relative(workspaceRoot, changedPath);
    process.stdout.write(`[wallet-server:dev] restart triggered by ${reason}\n`);

    if (!childProcess) {
      startServer();
      return;
    }

    const currentChild = childProcess;
    childProcess = null;
    currentChild.once("exit", () => {
      if (!shuttingDown) {
        startServer();
      }
    });
    currentChild.kill("SIGTERM");

    setTimeout(() => {
      if (currentChild.exitCode === null && currentChild.signalCode === null) {
        currentChild.kill("SIGKILL");
      }
    }, 5000).unref();
  }, 150);
}

function shutdown(signal) {
  shuttingDown = true;
  if (pendingRestart) {
    clearTimeout(pendingRestart);
    pendingRestart = null;
  }

  if (!childProcess) {
    process.exit(0);
    return;
  }

  childProcess.once("exit", () => process.exit(0));
  childProcess.kill(signal);
}

const watcher = chokidar.watch(watchPaths, {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 100,
  },
});

watcher.on("all", (_eventName, changedPath) => {
  if (!shouldRestart(changedPath)) {
    return;
  }
  restartServer(changedPath);
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();

function shouldRestart(changedPath) {
  if (changedPath.startsWith(serverSourcePath)) {
    return /\.(ts|tsx|js|cjs|mjs)$/.test(changedPath);
  }

  return changedPath.endsWith(".cjs");
}
