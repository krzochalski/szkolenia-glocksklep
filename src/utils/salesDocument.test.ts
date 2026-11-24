import { describe, expect, it } from 'vitest';
import { deriveDocumentType, resolveProformaBuyer } from './salesDocument';

describe('deriveDocumentType', () => {
	it('returns invoice when NIP present', () => {
		expect(deriveDocumentType('8291724148')).toBe('invoice');
	});

	it('returns receipt when NIP missing', () => {
		expect(deriveDocumentType('')).toBe('receipt');
	});
});

describe('resolveProformaBuyer', () => {
	it('prefers enrollment invoice company over profile', () => {
		const buyer = resolveProformaBuyer(
			{
				name: 'Ada',
				email: 'a@x.pl',
				invoiceNip: '8291724148',
				invoiceCompanyName: 'Firma ABC',
				invoiceCompanyAddress: 'ul. 1',
			},
			'1111111111'
		);
		expect(buyer.nip).toBe('8291724148');
		expect(buyer.displayName).toBe('Firma ABC');
		expect(buyer.address).toBe('ul. 1');
	});
});