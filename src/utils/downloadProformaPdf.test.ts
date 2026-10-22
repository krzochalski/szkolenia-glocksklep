import { describe, expect, it } from 'vitest';
import { proformaPdfFileName } from './downloadProformaPdf';

describe('proformaPdfFileName', () => {
	it('sanitizes proforma numbers for filenames', () => {
		expect(proformaPdfFileName('PF/SZK-MF-PK/10/2026')).toBe('proforma-PF-SZK-MF-PK-10-2026.pdf');
	});

	it('falls back when empty', () => {
		expect(proformaPdfFileName('   ')).toBe('proforma-dokument.pdf');
	});
});
