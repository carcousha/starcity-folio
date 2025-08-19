import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false, // إيقاف overlay الأخطاء
      port: 5173, // تحديد منفذ HMR
      timeout: 30000, // زيادة timeout
    },
    watch: {
      usePolling: false, // إيقاف polling لتجنب التحميل المتكرر
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'], // تجاهل الملفات غير المهمة
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // تحسين التبعيات
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
