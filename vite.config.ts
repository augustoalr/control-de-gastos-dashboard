import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' -> funciona en GitHub Pages tanto en usuario.github.io/
// como en usuario.github.io/control-de-gastos-dashboard/ (ruta de proyecto).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: false },
  server: { port: 5173 },
});
