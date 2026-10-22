import dayjs from 'dayjs';
import type { BillingData } from '@/types/billingData';
import type { Course, CourseClass, Participant } from '@/types/course';
import type { ProformaInvoice } from '@/types/proformaInvoice';
import { formatProformaServiceName, getCourseKind } from '@/utils/courseKind';
import { proformaDueDate } from '@/utils/proformaDue';

export type ProformaBuyerInfo = {
	displayName?: string;
	email?: string;
	phone?: string;
	nip?: string;
	paid?: boolean;
};

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'i', 'do', 'na', 'z', 'w', 'we']);

/**
 * Short uppercase code from course name/slug, e.g. „Movement Fundamentals” → „MF”.
 * Falls back to a truncated slug/name when there is only one token.
 */
export const courseCodeFromName = (course: Pick<Course, 'name' | 'slug'>): string => {
	const source = (course.slug?.trim() || course.name?.trim() || 'XX')
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^a-zA-Z0-9\s\-_]/g, ' ');

	const parts = source
		.split(/[\s\-_]+/)
		.map((p) => p.trim())
		.filter((p) => p.length > 0 && !STOP_WORDS.has(p.toLowerCase()));

	if (parts.length >= 2) {
		return parts
			.slice(0, 4)
			.map((p) => p.charAt(0).toUpperCase())
			.join('');
	}

	return (parts[0] ?? 'XX').slice(0, 6).toUpperCase();
};

const buyerInitials = (buyer: ProformaBuyerInfo): string => {
	const name = buyer.displayName ?? buyer.email ?? 'NN';
	const initials = name
		.split(/[\s@.]+/)
		.filter((p) => p.length > 0)
		.slice(0, 2)
		.map((p) => p.charAt(0).toUpperCase())
		.join('');
	return initials || 'NN';
};

/**
 * Proforma number from course + buyer.
 * Format: PF/{SZK|TRN}-{courseCode}-{buyerInitials}/{month}/{year}
 * e.g. PF/SZK-MF-PK/10/2026
 */
export const generateProformaNumber = (
	course: Pick<Course, 'name' | 'slug' | 'kind'>,
	buyer: ProformaBuyerInfo,
	dateEntry: CourseClass
): string => {
	const date = dayjs(dateEntry.date);
	const month = date.format('MM');
	const year = date.format('YYYY');
	const kindCode = getCourseKind(course) === 'practice' ? 'TRN' : 'SZK';
	const courseCode = courseCodeFromName(course);
	const initials = buyerInitials(buyer);

	return `PF/${kindCode}-${courseCode}-${initials}/${month}/${year}`;
};

/** Returns the proforma invoice number for a given participant, course, and date. */
export const getProformaNumber = (
	course: Pick<Course, 'name' | 'slug' | 'kind'>,
	participant: Participant,
	dateEntry: CourseClass
): string =>
	generateProformaNumber(
		course,
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

	const number = buyer ? generateProformaNumber(course, buyer, dateEntry) : '—';
	const buyerName = buyer?.displayName?.trim() || buyer?.email?.trim() || '';
	const serviceName = formatProformaServiceName(course);

	return {
		number,
		issueDate: dayjs().format('YYYY-MM-DD'),
		dueDate: proformaDueDate(dateEntry.date),
		paymentMethod: billing.paymentMethod,
		issuePlace: billing.issuePlace,
		amountNet,
		amountVat,
		amountGross,
		vatRate,
		serviceName,
		paymentTitle: `${number} · ${serviceName}`,
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
		buyer: buyerName
			? {
					name: buyerName,
					email: buyer?.email,
					phone: buyer?.phone,
					nip: buyer?.nip,
				}
			: undefined,
	};
};
