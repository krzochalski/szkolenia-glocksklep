// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildProforma, FALLBACK_BILLING } from './build';
import {
	buildUpdatedProformaEmailHtml,
	buildUpdatedProformaEmailText,
	buildUpdatedProformaSubject,
} from './mail';

const invoice = buildProforma({
	kind: 'course',
	courseName: 'Metoda Fokusa',
	courseId: 'course1',
	dateId: 'date1',
	participantId: 'user1',
	classDateYmd: '2026-12-10',
	amountNet: 700,
	billing: FALLBACK_BILLING,
	buyer: { displayName: 'Jan Kowalski', email: 'jan@example.com' },
	baseAmountNet: 850,
	discountTotal: 150,
	discountReason: 'Rabat indywidualny',
});

describe('updated proforma e-mail', () => {
	it('subject includes course and date', () => {
		expect(
			buildUpdatedProformaSubject({
				courseName: 'Metoda Fokusa',
				classDateYmd: '2026-12-10',
			})
		).toBe('Zaktualizowana proforma – Metoda Fokusa, 2026-12-10');
	});

	it('shows old/new/difference and discount; demands payment when unpaid', () => {
		const html = buildUpdatedProformaEmailHtml({
			invoice,
			courseUrl: 'https://example.com/c',
			courseName: 'Metoda Fokusa',
			classDateYmd: '2026-12-10',
			oldAmountNet: 850,
			newAmountNet: 700,
			reason: 'Rabat indywidualny',
			alreadyPaidOverNew: false,
			previousProformaNumber: 'PF/OLD',
		});
		expect(html).toContain('Rabat indywidualny');
		expect(html).toContain('850.00');
		expect(html).toContain('700.00');
		expect(html).toContain('nie jest już ważna');
		expect(html).toContain('Dane do przelewu');

		const text = buildUpdatedProformaEmailText({
			invoice,
			courseUrl: 'https://example.com/c',
			courseName: 'Metoda Fokusa',
			classDateYmd: '2026-12-10',
			oldAmountNet: 850,
			newAmountNet: 700,
			reason: 'Rabat indywidualny',
			alreadyPaidOverNew: false,
			previousProformaNumber: 'PF/OLD',
		});
		expect(text).toContain('PF/OLD');
		expect(text).toContain('Tytuł:');
	});

	it('does not demand payment when already paid more than new amount', () => {
		const html = buildUpdatedProformaEmailHtml({
			invoice,
			courseUrl: 'https://example.com/c',
			courseName: 'Metoda Fokusa',
			classDateYmd: '2026-12-10',
			oldAmountNet: 850,
			newAmountNet: 700,
			reason: 'Rabat indywidualny',
			alreadyPaidOverNew: true,
		});
		expect(html).toContain('Nie wymagamy dopłaty');
		expect(html).toContain('nadpłaty');
		expect(html).not.toContain('Dane do przelewu');
	});
});
