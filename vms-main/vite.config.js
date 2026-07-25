import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'vms-main/index.html',
        admin: 'vms-main/admin.html',
        employee: 'vms-main/employee.html',
        security: 'vms-main/security.html',
        visitorPortal: 'vms-main/visitor-portal.html',
        visitorServices: 'vms-main/visitor-services.html',
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

