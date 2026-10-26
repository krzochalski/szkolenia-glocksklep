import type { PriceMode } from '@ui';
import { formatCurrencyAmount } from '@ui';
import type { Course, CourseClass, Participant } from '@/types/course';

const VAT_RATE = 0.23;

/** Round PLN amount to grosze (2 decimal places). */
export const roundMoney = (n: number): number => Math.round(n * 100) / 100;

/**
 * Payable PLN netto for a known signup.
 * Precedence: participant override → date override → catalog course price.
 * Public/pre-enroll UI must not use participant override (never leak others’ prices).
 */
export const effectiveEnrollmentNetto = (
	course: Pick<Course, 'price'>,
	date: Pick<CourseClass, 'customPrice'>,
	participant?: Pick<Participant, 'customPrice'> | null
): number => roundMoney(participant?.customPrice ?? date.customPrice ?? course.price);

/**
 * Validate admin-entered individual netto. Empty / null / undefined → clear (`null`).
 * Rejects NaN and negative values.
 */
export const parseParticipantCustomPriceNetto = (raw: unknown): number | null => {
	if (raw === null || raw === undefined) return null;
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed === '') return null;
		const n = Number(trimmed);
		if (!Number.isFinite(n) || n < 0) {
			throw new Error('Podaj prawidłową kwotę netto (≥ 0).');
		}
		return roundMoney(n);
	}
	if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
		throw new Error('Podaj prawidłową kwotę netto (≥ 0).');
	}
	return roundMoney(raw);
};

/** Format amount as `0.00` (no currency suffix). */
export const formatMoney = (n: number): string => roundMoney(n).toFixed(2);

/** VAT 23%: kwota VAT = round(netto × 0.23) to grosze. */
export const vatFromNetto = (netto: number): number => roundMoney(roundMoney(netto) * VAT_RATE);

/**
 * Brutto from netto at Polish standard VAT 23%.
 * Invoice rule: brutto = netto + round(netto × 0.23) — not round(netto × 1.23).
 */
export const bruttoFromNetto = (netto: number): number => {
	const n = roundMoney(netto);
	return roundMoney(n + vatFromNetto(n));
};

/** Display PLN for nearest-date rows: `500 zł` (drops trailing `.00`). */
export const formatPlnDisplay = (netto: number, mode?: PriceMode): string => {
	const amount = roundMoney(mode === 'brutto' ? bruttoFromNetto(netto) : netto);
	const formatted = Number.isInteger(amount) ? String(amount) : formatMoney(amount);
	return `${formatted} zł`;
};

/**
 * Compact dual label for dialogs / one-line summaries (brutto first).
 * Uses the same Intl formatting as `@ui` Price.
 */
export const formatPlnNettoBrutto = (netto: number): string => {
	const gross = bruttoFromNetto(netto);
	const n = roundMoney(netto);
	return `${formatCurrencyAmount(gross)} brutto / ${formatCurrencyAmount(n)} netto`;
};

/** Course list/detail price: stored as netto, shown as `850.00PLN`. */
export const formatCoursePrice = (netto: number, mode: PriceMode): string => {
	const amount = mode === 'brutto' ? bruttoFromNetto(netto) : roundMoney(netto);
	return `${formatMoney(amount)}PLN`;
};
