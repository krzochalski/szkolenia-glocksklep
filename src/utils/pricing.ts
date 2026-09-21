import type { PriceMode } from '@ui';

const VAT_RATE = 0.23;

/** Round PLN amount to grosze (2 decimal places). */
export const roundMoney = (n: number): number => Math.round(n * 100) / 100;

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

/** Course list/detail price: stored as netto, shown as `850.00PLN`. */
export const formatCoursePrice = (netto: number, mode: PriceMode): string => {
	const amount = mode === 'brutto' ? bruttoFromNetto(netto) : roundMoney(netto);
	return `${formatMoney(amount)}PLN`;
};
