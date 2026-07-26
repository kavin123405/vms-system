import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: 'vms-main',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'vms-main/index.html'),
        admin: resolve(__dirname, 'vms-main/admin.html'),
        employee: resolve(__dirname, 'vms-main/employee.html'),
        security: resolve(__dirname, 'vms-main/security.html'),
        visitorPortal: resolve(__dirname, 'vms-main/visitor-portal.html'),
        visitorServices: resolve(__dirname, 'vms-main/visitor-services.html'),
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});




