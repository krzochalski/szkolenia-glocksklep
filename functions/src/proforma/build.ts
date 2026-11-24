/** Pure proforma builders (no I/O). Mirrors app pricing + client proforma number rules. */

export const PROFORMA_DUE_DAYS_BEFORE = 5;

export type ProformaCourseKind = 'course' | 'practice';

export type ProformaBuyerInput = {
	displayName?: string;
	email?: string;
	phone?: string;
	nip?: string;
	address?: string;
};

export type ProformaBillingInput = {
	name: string;
	address: string;
	city: string;
	nip: string;
	website?: string;
	phone?: string;
	bankName: string;
	bankAccount: string;
	paymentMethod: string;
	issuePlace: string;
	vatRate: number;
};

export type BuiltProforma = {
	number: string;
	issueDate: string;
	dueDate: string;
	paymentMethod: string;
	issuePlace: string;
	amountNet: number;
	amountVat: number;
	amountGross: number;
	vatRate: number;
	serviceName: string;
	serviceLine: string;
	paymentTitle: string;
	/** List / regular netto before manual discount (when discount shown). */
	baseAmountNet?: number;
	discountTotal?: number;
	discountReason?: string;
	/** One-line customer text: regular / rebate / due. */
	discountDescription?: string;
	seller: ProformaBillingInput;
	buyer: {
		name: string;
		email?: string;
		phone?: string;
		nip?: string;
		address?: string;
	};
};

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'i', 'do', 'na', 'z', 'w', 'we']);

export const roundMoney = (n: number): number => Math.round(n * 100) / 100;

export const formatMoney = (n: number): string => roundMoney(n).toFixed(2);

/** Payable PLN netto: participant → date → course. */
export const effectiveEnrollmentNetto = (
	coursePrice: number,
	dateCustomPrice?: number | null,
	participantCustomPrice?: number | null
): number =>
	roundMoney(participantCustomPrice ?? dateCustomPrice ?? coursePrice);

export const vatFromNetto = (netto: number, vatRatePercent: number): number =>
	roundMoney(roundMoney(netto) * (vatRatePercent / 100));

export const bruttoFromNetto = (netto: number, vatRatePercent: number): number => {
	const n = roundMoney(netto);
	return roundMoney(n + vatFromNetto(n, vatRatePercent));
};

/** YYYY-MM-DD due = class date − PROFORMA_DUE_DAYS_BEFORE. */
export const proformaDueDate = (classDateYmd: string): string => {
	const [y, m, d] = classDateYmd.split('-').map(Number);
	const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	dt.setUTCDate(dt.getUTCDate() - PROFORMA_DUE_DAYS_BEFORE);
	const yy = dt.getUTCFullYear();
	const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(dt.getUTCDate()).padStart(2, '0');
	return `${yy}-${mm}-${dd}`;
};

export const todayYmd = (now: Date = new Date()): string => {
	const yy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	return `${yy}-${mm}-${dd}`;
};

export const courseCodeFromName = (name: string, slug?: string): string => {
	const source = (slug?.trim() || name?.trim() || 'XX')
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

const buyerInitials = (buyer: ProformaBuyerInput): string => {
	const name = buyer.displayName ?? buyer.email ?? 'NN';
	const initials = name
		.split(/[\s@.]+/)
		.filter((p) => p.length > 0)
		.slice(0, 2)
		.map((p) => p.charAt(0).toUpperCase())
		.join('');
	return initials || 'NN';
};

export const formatProformaServiceName = (
	kind: ProformaCourseKind,
	courseName: string
): string => {
	const prefix = kind === 'practice' ? 'Trening strzelecki' : 'Szkolenie strzeleckie';
	const name = courseName.trim() || '—';
	return `${prefix}: ${name}`;
};

/**
 * PF/{SZK|TRN}-{courseCode}-{buyerInitials}/{month}/{year}
 * e.g. PF/SZK-MF-PK/10/2026
 */
export const generateProformaNumber = (input: {
	kind: ProformaCourseKind;
	courseName: string;
	courseSlug?: string;
	buyer: ProformaBuyerInput;
	classDateYmd: string;
}): string => {
	const [year = '2026', month = '01'] = input.classDateYmd.split('-');
	const kindCode = input.kind === 'practice' ? 'TRN' : 'SZK';
	const courseCode = courseCodeFromName(input.courseName, input.courseSlug);
	const initials = buyerInitials(input.buyer);
	return `PF/${kindCode}-${courseCode}-${initials}/${month}/${year}`;
};

/** Skip auto-proforma when free or cash. */
export const shouldSkipProforma = (input: {
	amountNet: number;
	paysByCash?: boolean;
}): boolean => input.paysByCash === true || input.amountNet <= 0;

export const buildPaymentTitle = (input: {
	number: string;
	serviceName: string;
	courseId: string;
	dateId: string;
	participantId: string;
}): string => {
	const ref = `${input.courseId.slice(0, 6)}/${input.dateId.slice(0, 6)}/${input.participantId.slice(0, 8)}`;
	return `${input.number} · ${input.serviceName} · ${ref}`;
};

export const proformaPdfFileName = (number: string): string => {
	const safe = number.replace(/[^\w.-]+/g, '_');
	return `proforma-${safe}.pdf`;
};

/** Strip trailing `/vN` so we can re-append the current version. */
export const baseProformaNumber = (number: string): string =>
	number.replace(/\/v\d+$/i, '');

/** Version 1 keeps the base number; later revisions append `/v{n}`. */
export const withProformaVersion = (baseNumber: string, version: number): string => {
	const base = baseProformaNumber(baseNumber.trim());
	if (version <= 1) return base;
	return `${base}/v${version}`;
};

export const buildDiscountDescription = (input: {
	baseAmountNet: number;
	discountTotal: number;
	finalAmountNet: number;
	reason?: string;
}): string => {
	const reasonPart = input.reason?.trim() ? ` (${input.reason.trim()})` : '';
	return `Cena regularna ${formatMoney(input.baseAmountNet)} zł, rabat ${formatMoney(input.discountTotal)} zł${reasonPart}, do zapłaty ${formatMoney(input.finalAmountNet)} zł`;
};

export const buildProforma = (input: {
	kind: ProformaCourseKind;
	courseName: string;
	courseSlug?: string;
	courseId: string;
	dateId: string;
	participantId: string;
	classDateYmd: string;
	classTimeStart?: string;
	amountNet: number;
	billing: ProformaBillingInput;
	buyer: ProformaBuyerInput;
	issueDate?: string;
	existingNumber?: string;
	/** When set and discountTotal > 0, discount lines appear on PDF/e-mail. */
	baseAmountNet?: number;
	discountTotal?: number;
	discountReason?: string;
}): BuiltProforma => {
	const vatRate = input.billing.vatRate > 0 ? input.billing.vatRate : 23;
	const amountNet = roundMoney(input.amountNet);
	const amountVat = vatFromNetto(amountNet, vatRate);
	const amountGross = bruttoFromNetto(amountNet, vatRate);
	const serviceName = formatProformaServiceName(input.kind, input.courseName);
	const timePart = input.classTimeStart?.trim() ? ` · ${input.classTimeStart.trim()}` : '';
	const serviceLine = `${serviceName} (${input.classDateYmd}${timePart})`;
	const number =
		input.existingNumber?.trim() ||
		generateProformaNumber({
			kind: input.kind,
			courseName: input.courseName,
			courseSlug: input.courseSlug,
			buyer: input.buyer,
			classDateYmd: input.classDateYmd,
		});
	const buyerName =
		input.buyer.displayName?.trim() || input.buyer.email?.trim() || 'Uczestnik';
	const buyerAddress = input.buyer.address?.trim();
	const paymentTitle = buildPaymentTitle({
		number,
		serviceName,
		courseId: input.courseId,
		dateId: input.dateId,
		participantId: input.participantId,
	});

	const discountTotal =
		input.discountTotal != null && input.discountTotal > 0
			? roundMoney(input.discountTotal)
			: undefined;
	const baseAmountNet =
		discountTotal != null && discountTotal > 0
			? roundMoney(input.baseAmountNet ?? amountNet + discountTotal)
			: undefined;
	const discountReason = input.discountReason?.trim() || undefined;
	const discountDescription =
		baseAmountNet != null && discountTotal != null
			? buildDiscountDescription({
					baseAmountNet,
					discountTotal,
					finalAmountNet: amountNet,
					reason: discountReason,
				})
			: undefined;

	return {
		number,
		issueDate: input.issueDate ?? todayYmd(),
		dueDate: proformaDueDate(input.classDateYmd),
		paymentMethod: input.billing.paymentMethod || 'Przelew',
		issuePlace: input.billing.issuePlace,
		amountNet,
		amountVat,
		amountGross,
		vatRate,
		serviceName,
		serviceLine,
		paymentTitle,
		...(baseAmountNet != null ? { baseAmountNet } : {}),
		...(discountTotal != null ? { discountTotal } : {}),
		...(discountReason ? { discountReason } : {}),
		...(discountDescription ? { discountDescription } : {}),
		seller: input.billing,
		buyer: {
			name: buyerName,
			email: input.buyer.email,
			phone: input.buyer.phone,
			nip: input.buyer.nip,
			...(buyerAddress ? { address: buyerAddress } : {}),
		},
	};
};

/** Fallback seller when Firestore billingData is missing (mirrors app billingData.ts). */
export const FALLBACK_BILLING: ProformaBillingInput = {
	name: 'Stay Frosty PIOTR KRZOSKA',
	address: 'Łaska 75/79',
	city: '98-220 Zduńska Wola, Polska',
	nip: '8291724148',
	website: 'http://glocksklep.pl/',
	phone: '+48530556523',
	bankName: 'mBank',
	bankAccount: 'PL19114020040000310277052051',
	paymentMethod: 'Przelew',
	issuePlace: 'Zduńska Wola',
	vatRate: 23,
};
