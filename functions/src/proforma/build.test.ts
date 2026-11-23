// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
	baseProformaNumber,
	bruttoFromNetto,
	buildDiscountDescription,
	buildPaymentTitle,
	buildProforma,
	courseCodeFromName,
	effectiveEnrollmentNetto,
	FALLBACK_BILLING,
	generateProformaNumber,
	proformaDueDate,
	proformaPdfFileName,
	shouldSkipProforma,
	vatFromNetto,
	withProformaVersion,
} from './build';

describe('effectiveEnrollmentNetto', () => {
	it('prefers participant customPrice over date and course', () => {
		expect(effectiveEnrollmentNetto(500, 400, 300)).toBe(300);
		expect(effectiveEnrollmentNetto(500, 400, null)).toBe(400);
		expect(effectiveEnrollmentNetto(500, undefined, undefined)).toBe(500);
	});
});

describe('VAT', () => {
	it('uses billing vat rate (23%)', () => {
		expect(vatFromNetto(100, 23)).toBe(23);
		expect(bruttoFromNetto(100, 23)).toBe(123);
	});
});

describe('proformaDueDate', () => {
	it('is class date minus 5 days', () => {
		expect(proformaDueDate('2026-11-20')).toBe('2026-11-15');
	});
});

describe('shouldSkipProforma', () => {
	it('skips free and cash', () => {
		expect(shouldSkipProforma({ amountNet: 0 })).toBe(true);
		expect(shouldSkipProforma({ amountNet: 100, paysByCash: true })).toBe(true);
		expect(shouldSkipProforma({ amountNet: 100 })).toBe(false);
	});
});

describe('generateProformaNumber', () => {
	it('builds PF/SZK-… number', () => {
		const n = generateProformaNumber({
			kind: 'course',
			courseName: 'Movement Fundamentals',
			courseSlug: 'movement-fundamentals',
			buyer: { displayName: 'Piotr Kowalski' },
			classDateYmd: '2026-10-15',
		});
		expect(n).toMatch(/^PF\/SZK-MF-PK\/10\/2026$/);
	});
});

describe('courseCodeFromName', () => {
	it('uses initials from multi-word names', () => {
		expect(courseCodeFromName('Movement Fundamentals')).toBe('MF');
	});
});

describe('buildProforma', () => {
	it('builds buyer with NIP and discounted netto', () => {
		const invoice = buildProforma({
			kind: 'course',
			courseName: 'Movement Fundamentals',
			courseSlug: 'movement-fundamentals',
			courseId: 'courseLongId',
			dateId: 'dateLongId',
			participantId: 'userUid12',
			classDateYmd: '2026-11-20',
			classTimeStart: '10:00',
			amountNet: 400,
			billing: { ...FALLBACK_BILLING, vatRate: 23 },
			buyer: {
				displayName: 'Anna Nowak',
				email: 'anna@example.com',
				nip: '1234567890',
			},
			issueDate: '2026-11-01',
		});
		expect(invoice.amountNet).toBe(400);
		expect(invoice.amountVat).toBe(92);
		expect(invoice.amountGross).toBe(492);
		expect(invoice.dueDate).toBe('2026-11-15');
		expect(invoice.buyer.nip).toBe('1234567890');
		expect(invoice.buyer.email).toBe('anna@example.com');
		expect(invoice.serviceLine).toContain('2026-11-20');
		expect(invoice.paymentTitle).toContain(invoice.number);
	});

	it('builds buyer without company/NIP', () => {
		const invoice = buildProforma({
			kind: 'practice',
			courseName: 'Trening',
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
			classDateYmd: '2026-12-01',
			amountNet: 150,
			billing: FALLBACK_BILLING,
			buyer: { displayName: 'Jan', email: 'jan@example.com' },
		});
		expect(invoice.buyer.nip).toBeUndefined();
		expect(invoice.number.startsWith('PF/TRN-')).toBe(true);
	});

	it('reuses existingNumber', () => {
		const invoice = buildProforma({
			kind: 'course',
			courseName: 'X',
			courseId: 'c',
			dateId: 'd',
			participantId: 'u',
			classDateYmd: '2026-01-10',
			amountNet: 10,
			billing: FALLBACK_BILLING,
			buyer: { email: 'a@b.c' },
			existingNumber: 'PF/EXISTING/01/2026',
		});
		expect(invoice.number).toBe('PF/EXISTING/01/2026');
	});
});

describe('withProformaVersion / discount description', () => {
	it('appends /vN for revisions', () => {
		expect(baseProformaNumber('PF/A/01/2026/v3')).toBe('PF/A/01/2026');
		expect(withProformaVersion('PF/A/01/2026', 1)).toBe('PF/A/01/2026');
		expect(withProformaVersion('PF/A/01/2026', 2)).toBe('PF/A/01/2026/v2');
		expect(
			buildDiscountDescription({
				baseAmountNet: 850,
				discountTotal: 50,
				finalAmountNet: 800,
				reason: 'Rabat indywidualny',
			})
		).toContain('Rabat indywidualny');
	});

	it('puts discount fields on BuiltProforma', () => {
		const invoice = buildProforma({
			kind: 'course',
			courseName: 'Test',
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
			classDateYmd: '2026-12-01',
			amountNet: 800,
			billing: FALLBACK_BILLING,
			buyer: { email: 'a@b.c', displayName: 'A B' },
			baseAmountNet: 850,
			discountTotal: 50,
			discountReason: 'Rabat indywidualny',
		});
		expect(invoice.discountTotal).toBe(50);
		expect(invoice.discountDescription).toContain('850.00');
		expect(invoice.discountDescription).toContain('Rabat indywidualny');
	});
});

describe('buildPaymentTitle / pdf filename', () => {
	it('includes matching ref', () => {
		const title = buildPaymentTitle({
			number: 'PF/1',
			serviceName: 'Szkolenie',
			courseId: 'abcdef123',
			dateId: 'xyz789',
			participantId: 'uidabcdefgh',
		});
		expect(title).toContain('abcdef');
		expect(title).toContain('uidabcde');
	});

	it('sanitizes filename', () => {
		expect(proformaPdfFileName('PF/SZK-MF-PK/10/2026')).toBe(
			'proforma-PF_SZK-MF-PK_10_2026.pdf'
		);
	});
});
