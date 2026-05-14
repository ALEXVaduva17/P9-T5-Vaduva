import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic'
  },
  server: {
    host: "0.0.0.0", // Expose to Docker network
    port: 5173,
    fs: {
      strict: false,
    },
    watch: {
      usePolling: true, // Required for hot-reload inside Docker (volume mounts)
    },
    proxy: {
      // Proxy /api requests to the FastAPI backend service
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});