/**
 * Piotr Krzoska instructor + billing seed (sourced from rp-arms-academy / FALLBACK_BILLING).
 * Used by scripts/seed-piotr-instructor.ts — do not treat as runtime config.
 */
export const PIOTR_INSTRUCTOR_SEED = {
	name: 'PIOTR "GLOCKACCI" KRZOSKA',
	slug: 'piotr-krzoska',
	bio: 'Zdobywca wielu krajowych i regionalnych tytułów IPSC, IDPA, PiRO.',
	email: 'szkolenia@glocksklep.pl',
} as const;

export const PIOTR_BILLING_SEED = {
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
} as const;
