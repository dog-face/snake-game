import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub React Three libraries for testing
      '@react-three/fiber': path.resolve(__dirname, './src/test/mocks/react-three-fiber.ts'),
      '@react-three/cannon': path.resolve(__dirname, './src/test/mocks/react-three-cannon.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
});

