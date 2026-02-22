import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'src/test/**/*',
        'src/app/**/*',
        'src/generated/**/*',
        'src/types/**/*',
        'src/lib/db.ts',
        'src/lib/auth.ts',
        'src/lib/workout/types.ts',
        'src/components/auth/AuthProvider.tsx',
        'src/components/ui/AppShell.tsx',
        'src/components/ui/IconMark.tsx',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 82,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
