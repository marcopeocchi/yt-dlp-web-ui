import ViteYaml from '@modyfi/vite-plugin-yaml';
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

const config = {
    plugins: [
        ViteYaml(),
        react(),
    ],
    root: './frontend',
    build: {
        emptyOutDir: true,
        outDir: resolve(__dirname, 'dist', 'frontend'),
    }
}

export default config