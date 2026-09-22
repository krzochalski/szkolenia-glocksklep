#!/usr/bin/env node
/**
 * Ensures `packages/ui` (glocksklep-design-system submodule) is checked out.
 * Runs from `preinstall` so plain `git clone` + install still works without
 * remembering `--recurse-submodules`.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const marker = join(root, 'packages', 'ui', 'package.json');
const gitmodules = join(root, '.gitmodules');

const ok = () => existsSync(marker);

if (ok()) {
	process.exit(0);
}

if (!existsSync(join(root, '.git'))) {
	console.error(
		'[ensure-ui-submodule] packages/ui is missing and this tree is not a git clone. ' +
			'Clone the app with: git clone --recurse-submodules <repo-url>'
	);
	process.exit(1);
}

if (!existsSync(gitmodules)) {
	console.error(
		'[ensure-ui-submodule] packages/ui is missing and .gitmodules is absent. ' +
			'Restore .gitmodules or clone with --recurse-submodules.'
	);
	process.exit(1);
}

console.log('[ensure-ui-submodule] packages/ui missing — git submodule update --init --recursive');
const result = spawnSync('git', ['submodule', 'update', '--init', '--recursive'], {
	cwd: root,
	stdio: 'inherit',
	shell: false,
});

if (result.error) {
	console.error('[ensure-ui-submodule] failed to spawn git:', result.error.message);
	process.exit(1);
}

if (result.status !== 0 || !ok()) {
	console.error(
		'[ensure-ui-submodule] could not check out packages/ui.\n' +
			'  Fix: git submodule update --init --recursive\n' +
			'  Or:  git clone --recurse-submodules <repo-url>'
	);
	process.exit(1);
}
