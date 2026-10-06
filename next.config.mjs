import { createPathAliases } from './path-aliases.mjs';

const { turbopackAlias } = createPathAliases();

const appBuildId =
	process.env.NEXT_PUBLIC_APP_BUILD_ID ??
	process.env.GITHUB_SHA?.slice(0, 12) ??
	`local-${Date.now().toString(36)}`;

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
	],
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		useTypeScriptCli: true,
	},
	agentRules: false,
	turbopack: {
		resolveAlias: turbopackAlias,
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
