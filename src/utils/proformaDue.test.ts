import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
	isParticipantPaymentOverdue,
	PROFORMA_DUE_DAYS_BEFORE,
	proformaDueDate,
} from './proformaDue';

describe('proformaDue', () => {
	it('due date is class date minus 5 days', () => {
		expect(PROFORMA_DUE_DAYS_BEFORE).toBe(5);
		expect(proformaDueDate('2026-10-22')).toBe('2026-10-17');
	});

	it('paid is never overdue', () => {
		expect(isParticipantPaymentOverdue(true, '2026-10-01', dayjs('2026-12-01'))).toBe(false);
	});

	it('unpaid is not overdue on or before due date', () => {
		expect(isParticipantPaymentOverdue(false, '2026-10-22', dayjs('2026-10-17'))).toBe(false);
		expect(isParticipantPaymentOverdue(false, '2026-10-22', dayjs('2026-10-10'))).toBe(false);
	});

	it('unpaid is overdue after due date', () => {
		expect(isParticipantPaymentOverdue(false, '2026-10-22', dayjs('2026-10-18'))).toBe(true);
	});
});
