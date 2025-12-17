import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // 使用esbuild压缩（默认，无需额外依赖）
    minify: 'esbuild',
    // esbuild配置
    esbuild: {
      drop: ['console', 'debugger']  // 移除console和debugger
    },
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'icons': ['lucide-react'],
          'http': ['axios']
        }
      }
    },
    // CSS压缩
    cssMinify: true,
    // chunk大小警告阈值
    chunkSizeWarningLimit: 500,
    // 禁用source map以减小体积
    sourcemap: false
  }
})

