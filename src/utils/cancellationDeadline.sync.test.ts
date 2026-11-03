import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stripHeaderComments = (source: string): string =>
	source.replace(/^\/\*\*[\s\S]*?\*\/\s*/u, '');

describe('cancellationDeadline shared copies', () => {
	it('app and functions implementations stay identical (minus header comment)', () => {
		const app = stripHeaderComments(
			readFileSync(resolve('src/utils/cancellationDeadline.ts'), 'utf8')
		);
		const functions = stripHeaderComments(
			readFileSync(resolve('functions/src/cancellationDeadline.ts'), 'utf8')
		);
		expect(app).toBe(functions);
	});
});
