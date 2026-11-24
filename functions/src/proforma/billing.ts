import type { Firestore } from 'firebase-admin/firestore';

import { FALLBACK_BILLING, type ProformaBillingInput } from './build';

export const asBilling = (data: Record<string, unknown> | undefined): ProformaBillingInput => {
	if (!data) return { ...FALLBACK_BILLING };
	const vatRate =
		typeof data.vatRate === 'number' && data.vatRate > 0 ? data.vatRate : 23;
	return {
		name: typeof data.name === 'string' && data.name.trim() ? data.name : FALLBACK_BILLING.name,
		address:
			typeof data.address === 'string' && data.address.trim()
				? data.address
				: FALLBACK_BILLING.address,
		city: typeof data.city === 'string' && data.city.trim() ? data.city : FALLBACK_BILLING.city,
		nip: typeof data.nip === 'string' && data.nip.trim() ? data.nip : FALLBACK_BILLING.nip,
		website: typeof data.website === 'string' ? data.website : FALLBACK_BILLING.website,
		phone: typeof data.phone === 'string' ? data.phone : FALLBACK_BILLING.phone,
		bankName:
			typeof data.bankName === 'string' && data.bankName.trim()
				? data.bankName
				: FALLBACK_BILLING.bankName,
		bankAccount:
			typeof data.bankAccount === 'string' && data.bankAccount.trim()
				? data.bankAccount
				: FALLBACK_BILLING.bankAccount,
		paymentMethod:
			typeof data.paymentMethod === 'string' && data.paymentMethod.trim()
				? data.paymentMethod
				: FALLBACK_BILLING.paymentMethod,
		issuePlace:
			typeof data.issuePlace === 'string' && data.issuePlace.trim()
				? data.issuePlace
				: FALLBACK_BILLING.issuePlace,
		vatRate,
	};
};

export const loadBilling = async (
	db: Firestore,
	instructorId: string | undefined
): Promise<ProformaBillingInput> => {
	if (!instructorId) return { ...FALLBACK_BILLING };
	const snap = await db
		.collection('billingData')
		.where('instructorId', '==', instructorId)
		.limit(1)
		.get();
	if (snap.empty) return { ...FALLBACK_BILLING };
	return asBilling(snap.docs[0].data() as Record<string, unknown>);
};