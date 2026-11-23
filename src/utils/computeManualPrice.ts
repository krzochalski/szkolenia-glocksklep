import { roundMoney } from './pricing';

export type ManualPriceAdjustmentType = 'finalPrice' | 'percent' | 'fixed';

export type ManualPriceAdjustmentInput = {
	readonly type: ManualPriceAdjustmentType;
	readonly value: number;
};

export type ComputedManualPrice = {
	readonly finalPrice: number;
	readonly discountTotal: number;
};

/**
 * Manual per-signup price on top of list `basePrice`.
 * Tag automatic discounts are out of scope (always 0) — percent/fixed apply to base.
 * `finalPrice` type sets payable netto directly. Never below 0; grosze rounding.
 */
export const computeManualPrice = (
	basePrice: number,
	adjustment: ManualPriceAdjustmentInput | null | undefined
): ComputedManualPrice => {
	const base = roundMoney(basePrice);
	if (!adjustment) {
		return { finalPrice: base, discountTotal: 0 };
	}
	if (!Number.isFinite(adjustment.value)) {
		throw new Error('Nieprawidłowa wartość korekty ceny.');
	}

	let finalPrice: number;
	switch (adjustment.type) {
		case 'finalPrice':
			finalPrice = roundMoney(adjustment.value);
			break;
		case 'percent': {
			if (adjustment.value < 0 || adjustment.value > 100) {
				throw new Error('Procent rabatu musi być w zakresie 0–100.');
			}
			finalPrice = roundMoney(base * (1 - adjustment.value / 100));
			break;
		}
		case 'fixed':
			finalPrice = roundMoney(base - adjustment.value);
			break;
		default: {
			const _exhaustive: never = adjustment.type;
			throw new Error(`Nieznany typ korekty: ${_exhaustive}`);
		}
	}

	if (finalPrice < 0) finalPrice = 0;
	const discountTotal = roundMoney(Math.max(0, base - finalPrice));
	return { finalPrice, discountTotal };
};

/** Parse admin percent/fixed/final amount; empty → null (clear). */
export const parseAdjustmentValue = (raw: unknown): number | null => {
	if (raw === null || raw === undefined) return null;
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed === '') return null;
		const n = Number(trimmed.replace(',', '.'));
		if (!Number.isFinite(n)) throw new Error('Podaj prawidłową liczbę.');
		return roundMoney(n);
	}
	if (typeof raw !== 'number' || !Number.isFinite(raw)) {
		throw new Error('Podaj prawidłową liczbę.');
	}
	return roundMoney(raw);
};
