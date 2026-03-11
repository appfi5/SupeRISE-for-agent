import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.OWNER_UI_API_TARGET || "http://127.0.0.1:18799";
  const uiPort = parsePort(env.OWNER_UI_PORT, 4173);

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: uiPort,
      strictPort: true,
      proxy: {
        "/api": apiTarget,
        "/mcp": apiTarget,
        "/health": apiTarget,
      },
    },
  };
});

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }

  return parsed;
}
