import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

function loadTsconfigPaths() {
	const tsconfig = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
	return tsconfig.compilerOptions.paths;
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toProjectRelative(to) {
	const posix = to.replaceAll('\\', '/');
	if (posix.startsWith('./') || posix.startsWith('../')) {
		return posix;
	}
	return `./${posix}`;
}

/** Expand `tsconfig.json` paths for Vite/Vitest and Next turbopack. */
export function createPathAliases() {
	const wildcards = new Map();
	const exact = new Map();
	/** @type {Record<string, string>} */
	const turbopackAlias = {};

	for (const [from, tos] of Object.entries(loadTsconfigPaths())) {
		const to = tos[0];
		// Turbopack treats `/abs/path` as a server-relative import. Keep tsconfig shape.
		turbopackAlias[from] = toProjectRelative(to);

		if (from.endsWith('/*') && to.endsWith('/*')) {
			wildcards.set(from.slice(0, -2), path.resolve(root, to.slice(0, -2)));
			continue;
		}
		exact.set(from, path.resolve(root, to));
	}

	const byKeyLengthDesc = (a, b) => b[0].length - a[0].length;

	const viteAlias = [
		...[...exact.entries()].sort(byKeyLengthDesc).map(([find, replacement]) => ({
			find: new RegExp(`^${escapeRegex(find)}$`),
			replacement,
		})),
		...[...wildcards.entries()].sort(byKeyLengthDesc).map(([find, replacement]) => ({
			find,
			replacement,
		})),
	];

	return { root, turbopackAlias, viteAlias };
}
