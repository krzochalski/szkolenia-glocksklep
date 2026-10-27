export const FAQ_CATEGORY_OPTIONS = [
	{ value: 'rekrutacja', label: 'Rekrutacja i Zapisy' },
	{ value: 'sprzet', label: 'Sprzęt i Wyposażenie' },
	{ value: 'bezpieczenstwo', label: 'Bezpieczeństwo' },
	{ value: 'logistyka', label: 'Logistyka i Dojazd' },
] as const;

export type FaqCategoryValue = (typeof FAQ_CATEGORY_OPTIONS)[number]['value'];
