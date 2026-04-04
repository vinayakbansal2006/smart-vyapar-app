/**
 * =========================================================================
 * Vite Configuration (vite.config.ts)
 * -------------------------------------------------------------------------
 * Manages the build step and dev server configuration.
 * Maps environment variables onto the global process.env object explicitly
 * to work nicely with our bundled packages (e.g. Gemini AI, Supabase).
 * Sets server port binding and external host permissions (ngrok).
 * =========================================================================
 */
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      allowedHosts: [
        'dendrological-marcie-unattentively.ngrok-free.dev'
      ]
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(env.SUPABASE_ANON_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    }
  };
});