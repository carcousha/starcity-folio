import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// تكوين محسن للأداء والسرعة
export default defineConfig({
  server: {
    host: true,
    port: 3000,
    hmr: {
      overlay: false,
      timeout: 5000
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react',
      'sonner'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // المكتبات الأساسية
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'sonner'],
          
          // وحدات التطبيق
          'module-whatsapp': [
            'src/pages/whatsapp/index.tsx',
            'src/services/whatsappService.ts'
          ],
          'module-land-sales': [
            'src/pages/land-sales/index.tsx'
          ],
          'module-accounting': [
            'src/pages/accounting/index.tsx'
          ],
          'module-rental': [
            'src/pages/rental/index.tsx'
          ]
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
