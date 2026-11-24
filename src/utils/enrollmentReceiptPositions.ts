/**
 * Client copy of `functions/src/invoicing/receiptPositions.ts` (SZ-18).
 * Keep VAT / position math in sync with Cloud Functions.
 */

import { roundMoney } from '@/utils/pricing';

const bruttoFromNetto = (netto: number, vatRatePercent: number): number => {
	const n = roundMoney(netto);
	const vat = roundMoney(n * (vatRatePercent / 100));
	return roundMoney(n + vat);
};

export type InvoicePosition = {
	key: string;
	title: string;
	qty: number;
	netto: number;
	brutto: number;
};

export type RegistrationReceiptDisplayInput = {
	serviceLine: string;
	amountNet: number;
	baseAmountNet?: number;
	discountTotal?: number;
	discountReason?: string;
	vatRatePercent: number;
};

const discountNote = (input: RegistrationReceiptDisplayInput): string => {
	const discount = roundMoney(input.discountTotal ?? 0);
	if (discount <= 0) return '';
	const reason = input.discountReason?.trim();
	return reason ? ` (rabat ${discount.toFixed(2)} zł — ${reason})` : ` (rabat ${discount.toFixed(2)} zł)`;
};

/** Admin paragon preview rows (netto/brutto), mirrors Functions Fakturownia payload. */
export const expandEnrollmentReceiptPositions = (
	input: RegistrationReceiptDisplayInput
): InvoicePosition[] => {
	const vat = input.vatRatePercent > 0 ? input.vatRatePercent : 23;
	const finalNet = roundMoney(input.amountNet);
	const title = `${input.serviceLine.trim()}${discountNote(input)}`;

	return [
		{
			key: 'service',
			title,
			qty: 1,
			netto: finalNet,
			brutto: bruttoFromNetto(finalNet, vat),
		},
	];
};