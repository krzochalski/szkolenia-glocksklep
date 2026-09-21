import { spawn } from 'node:child_process';

const child = spawn(
	'npx',
	['-y', 'firebase-tools@latest', 'emulators:start', '--only', 'firestore,functions', '--project', 'szkolenia-glocksklep'],
	{
		stdio: 'inherit',
		shell: false,
	}
);

child.on('exit', (code) => {
	process.exit(code ?? 1);
});
