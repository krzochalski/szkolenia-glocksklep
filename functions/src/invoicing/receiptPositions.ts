/**
 * Pure receipt line builder for course registrations (SZ-18).
 * Mirrored in `src/utils/enrollmentReceiptPositions.ts` for admin UI/tests — keep in sync.
 * Pattern adapted from stayfrosty `expandReceiptPositions` (shop order lines).
 */

import { bruttoFromNetto, roundMoney } from '../proforma/build';

export type FakturowniaPosition = {
	name: string;
	tax: number;
	total_price_gross: number;
	quantity: number;
};

export type RegistrationReceiptInput = {
	serviceLine: string;
	amountNet: number;
	baseAmountNet?: number;
	discountTotal?: number;
	discountReason?: string;
	vatRatePercent: number;
};

const discountNote = (input: RegistrationReceiptInput): string => {
	const discount = roundMoney(input.discountTotal ?? 0);
	if (discount <= 0) return '';
	const reason = input.discountReason?.trim();
	return reason ? ` (rabat ${discount.toFixed(2)} zł — ${reason})` : ` (rabat ${discount.toFixed(2)} zł)`;
};

/** One or two Fakturownia rows: service (+ optional rabat row when breakdown is shown). */
export const buildRegistrationReceiptPositions = (
	input: RegistrationReceiptInput
): FakturowniaPosition[] => {
	const vat = input.vatRatePercent > 0 ? input.vatRatePercent : 23;
	const finalNet = roundMoney(input.amountNet);
	const baseNet = roundMoney(input.baseAmountNet ?? finalNet);
	const discount = roundMoney(input.discountTotal ?? Math.max(0, baseNet - finalNet));
	const title = `${input.serviceLine.trim()}${discountNote({ ...input, discountTotal: discount })}`;

	return [
		{
			name: title,
			tax: vat,
			total_price_gross: bruttoFromNetto(finalNet, vat),
			quantity: 1,
		},
	];
};

/** External id for Fakturownia `oid` — distinguish trainings from shop orders (ORD-*). */
export const registrationReceiptOid = (proformaNumber: string | undefined, fallback: string): string => {
	const num = proformaNumber?.trim();
	if (num) {
		return num.replace(/^PF\//, 'SZ/');
	}
	return fallback;
};