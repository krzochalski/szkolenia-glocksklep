/** Pure manual price math (mirrors src/utils/computeManualPrice.ts). */

export type ManualPriceAdjustmentType = 'finalPrice' | 'percent' | 'fixed';

export type ManualPriceAdjustmentInput = {
	readonly type: ManualPriceAdjustmentType;
	readonly value: number;
};

export type ComputedManualPrice = {
	readonly finalPrice: number;
	readonly discountTotal: number;
};

export const roundMoney = (n: number): number => Math.round(n * 100) / 100;

/**
 * Manual per-signup price on top of list `basePrice`.
 * Tag automatic discounts are out of scope (always 0).
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
