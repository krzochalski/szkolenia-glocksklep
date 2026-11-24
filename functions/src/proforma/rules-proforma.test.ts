// @vitest-environment node
/**
 * Documents Firestore security for participants[].proforma.
 * Non-admins cannot update `courses` at all (firestore.rules), so they cannot
 * forge proforma fields. Full rules emulator suite is not wired in this repo;
 * this test locks the intended invariant for reviewers.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('firestore rules — courses / proforma / priceChanges', () => {
	it('restricts courses writes to admins and notes Functions-owned proforma', () => {
		const rules = readFileSync(
			resolve(__dirname, '../../../firestore.rules'),
			'utf8'
		);
		expect(rules).toContain('participants[].proforma is Functions-owned');
		expect(rules).toContain('participants[].fakturownia');
		expect(rules).toMatch(/match \/courses\/\{courseId\}/);
		expect(rules).toMatch(/allow create, update, delete: if isAdmin\(\);/);
	});

	it('exposes priceChanges subcollection as admin-read / no client write', () => {
		const rules = readFileSync(
			resolve(__dirname, '../../../firestore.rules'),
			'utf8'
		);
		expect(rules).toMatch(/match \/priceChanges\/\{priceChangeId\}/);
		expect(rules).toContain('allow read: if isAdmin()');
		expect(rules).toContain('priceSnapshot / priceHistory / priceChanges');
	});
});
