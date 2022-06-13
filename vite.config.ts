import react from "@vitejs/plugin-react";
import ViteYaml from '@modyfi/vite-plugin-yaml';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(() => {
    return {
        plugins: [
            react(),
            ViteYaml(),
        ],
        root: resolve(__dirname, 'frontend'),
        build: {
            emptyOutDir: true,
            outDir: resolve(__dirname, 'dist', 'frontend'),
        }
    }
})
