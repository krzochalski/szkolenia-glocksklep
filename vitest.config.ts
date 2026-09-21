import { defineConfig } from 'vitest/config';
import { createPathAliases } from './path-aliases.mjs';

const { viteAlias } = createPathAliases();

export default defineConfig({
	oxc: {
		jsx: {
			runtime: 'automatic',
			importSource: 'react',
		},
	},
	resolve: {
		alias: viteAlias,
	},
	test: {
		globals: false,
		environment: 'jsdom',
		include: [
			'src/**/*.test.ts',
			'src/**/*.test.tsx',
			'packages/ui/src/**/*.test.ts',
			'packages/ui/src/**/*.test.tsx',
		],
		setupFiles: ['./src/test-setup.ts'],
		env: {
			VITEST: 'true',
			NEXT_PUBLIC_APP_BUILD_ID: 'test-build',
		},
	},
});
