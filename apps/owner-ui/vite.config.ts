import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.OWNER_UI_API_TARGET || "http://127.0.0.1:18799";
  const uiPort = Number(env.OWNER_UI_PORT || "4173");

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
