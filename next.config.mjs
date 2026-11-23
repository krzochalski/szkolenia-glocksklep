import { createPathAliases } from './path-aliases.mjs';

const { turbopackAlias } = createPathAliases();

const appBuildId =
	process.env.NEXT_PUBLIC_APP_BUILD_ID ??
	process.env.GITHUB_SHA?.slice(0, 12) ??
	`local-${Date.now().toString(36)}`;

const NO_CACHE = 'private, no-cache, max-age=0, must-revalidate';
const NO_CACHE_PUBLIC = 'no-cache, max-age=0, must-revalidate';

/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		NEXT_PUBLIC_APP_BUILD_ID: appBuildId,
	},
	transpilePackages: [
		'@stayfrosty/ui',
		'@mui/material',
		'@mui/system',
		'@mui/icons-material',
		'@emotion/react',
		'@emotion/styled',
		'@uiw/react-md-editor',
		'@uiw/react-markdown-preview',
	],
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		useTypeScriptCli: true,
		staleTimes: {
			dynamic: 0,
			static: 30,
		},
	},
	agentRules: false,
	turbopack: {
		resolveAlias: turbopackAlias,
	},
	async headers() {
		return [
			{
				source: '/sw.js',
				headers: [{ key: 'Cache-Control', value: NO_CACHE_PUBLIC }],
			},
			{
				source: '/manifest.webmanifest',
				headers: [{ key: 'Cache-Control', value: NO_CACHE_PUBLIC }],
			},
			{
				// App documents / RSC — exclude hashed static assets and common public files.
				source: '/((?!_next/static|_next/image|.*\\..*).*)',
				headers: [{ key: 'Cache-Control', value: NO_CACHE }],
			},
		];
	},
	async redirects() {
		return [
			{
				source: '/__/auth/action',
				destination: '/auth/action',
				permanent: false,
			},
		];
	},
};

export default nextConfig;
