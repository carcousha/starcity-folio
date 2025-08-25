import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// تكوين مبسط ومستقر
export default defineConfig({
  server: {
    host: true,
    port: 3000, // منفذ بسيط ومستقر
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
