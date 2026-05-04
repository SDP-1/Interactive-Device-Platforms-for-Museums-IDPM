import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5176 avoids Basii unified frontend (5173) in the full kiosk launcher.
// When running beside Basii, set MUSEUM_GCE_API_PROXY to the GCE Node port (e.g. http://127.0.0.1:5004).
const apiProxyTarget = process.env.MUSEUM_GCE_API_PROXY || 'http://127.0.0.1:5000';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5176,
        proxy: {
            '/api': {
                target: apiProxyTarget,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '/api'),
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        // console.log('Sending Request to the Target:', req.method, req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, req, res) => {
                        // console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                    });
                },
                timeout: 30000,
                proxyTimeout: 30000,
            },
        },
    },
});
