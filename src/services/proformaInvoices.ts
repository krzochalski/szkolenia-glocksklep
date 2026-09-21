import type { BillingData } from '@/types/billingData';
import type { Course, CourseClass, Participant } from '@/types/course';
import type { ProformaInvoice } from '@/types/proformaInvoice';
import dayjs from 'dayjs';

export type ProformaBuyerInfo = {
	displayName?: string;
	email?: string;
	paid?: boolean;
};

/**
 * Generates a proforma number from buyer info.
 * Format: PF/{initials}-{emailHash}/{month}/{year}
 */
export const generateProformaNumber = (
	buyer: ProformaBuyerInfo,
	dateEntry: CourseClass
): string => {
	const date = dayjs(dateEntry.date);
	const month = date.format('MM');
	const year = date.format('YYYY');

	const name = buyer.displayName ?? buyer.email ?? 'NN';
	const initials = name
		.split(/[\s@.]+/)
		.filter((p) => p.length > 0)
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join('');

	const emailShort = (buyer.email ?? 'unknown').split('@')[0].slice(0, 6).toUpperCase();

	return `PF/${initials}-${emailShort}/${month}/${year}`;
};

/** Returns the proforma invoice number for a given participant and course date. */
export const getProformaNumber = (participant: Participant, dateEntry: CourseClass): string =>
	generateProformaNumber(
		{ displayName: participant.name, email: participant.email, paid: participant.paid },
		dateEntry
	);

/** Builds a ProformaInvoice object from billing data + course info (pure, no async). */
export const buildProformaFromBilling = (
	course: Course,
	dateEntry: CourseClass,
	billing: BillingData,
	buyer?: ProformaBuyerInfo
): ProformaInvoice => {
	const price = dateEntry.customPrice ?? course.price;
	const vatRate = billing.vatRate;
	const amountNet = price;
	const amountGross = Math.round(price * (1 + vatRate / 100) * 100) / 100;
	const amountVat = Math.round((amountGross - amountNet) * 100) / 100;

	const number = buyer ? generateProformaNumber(buyer, dateEntry) : '—';

	return {
		number,
		issueDate: dayjs().format('YYYY-MM-DD'),
		dueDate: dayjs(dateEntry.date).subtract(3, 'day').format('YYYY-MM-DD'),
		paymentMethod: billing.paymentMethod,
		issuePlace: billing.issuePlace,
		amountNet,
		amountVat,
		amountGross,
		vatRate,
		serviceName: course.name,
		status: buyer?.paid ? 'paid' : 'unpaid',
		seller: {
			name: billing.name,
			address: billing.address,
			city: billing.city,
			nip: billing.nip,
			website: billing.website,
			phone: billing.phone,
			bankName: billing.bankName,
			bankAccount: billing.bankAccount,
		},
	};
};
