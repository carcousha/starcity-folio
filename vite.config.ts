import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080, // تغيير المنفذ إلى 8080
    hmr: {
      overlay: false,
      port: 8080, // تحديث منفذ HMR
      timeout: 30000,
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      '@tanstack/react-query',
      'react-router-dom',
      'lucide-react'
    ],
    exclude: ['@lovable/tagger']
  },
  build: {
    rollupOptions: {
      output: {
        // إزالة manualChunks لحل مشاكل التحميل الديناميكي
        manualChunks: undefined,
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // تحسينات إضافية للأداء
    target: 'esnext',
    minify: 'terser',
    sourcemap: mode === 'development',
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
  // إضافة إعدادات لحل مشاكل التحميل الديناميكي
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  // إزالة jsxInject لحل مشكلة React import
}));
