import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.NODE_ENV === 'test';
  
  const alias: Record<string, string> = {
    '@': path.resolve(__dirname, './src'),
  };
  
  // Only stub React Three libraries in test mode
  if (isTest) {
    alias['@react-three/fiber'] = path.resolve(__dirname, './src/test/mocks/react-three-fiber.ts');
    alias['@react-three/cannon'] = path.resolve(__dirname, './src/test/mocks/react-three-cannon.ts');
  }
  
  return {
    plugins: [react()],
    resolve: {
      alias,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    },
  };
});

