import react from '@vitejs/plugin-react-swc'
import million from 'million/compiler'
import ViteYaml from '@modyfi/vite-plugin-yaml'
import { defineConfig } from 'vite'

export default defineConfig(() => {
  return {
    plugins: [
      million.vite({ auto: true }),
      react(),
      ViteYaml(),
    ],
    base: '',
    build: {
      emptyOutDir: true,
    }
  }
})
