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
			NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
			NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
			NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
			NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
			NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '0',
			NEXT_PUBLIC_FIREBASE_APP_ID: '1:0:web:test',
		},
	},
});
