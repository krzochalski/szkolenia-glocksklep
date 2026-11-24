/** Shared copy: preferred payment method and automatic sales document (faktura vs paragon). */

export const PAYMENT_METHOD_PREFERRED = 'przelew bankowy';

export const PAYMENT_AND_DOCUMENT_INFO = {
	title: 'Płatność i dokument sprzedaży',
	payment:
		'Preferowana forma płatności to przelew bankowy — dane do przelewu znajdziesz w proformie po zapisie.',
	document:
		'Przy zapisie możesz opcjonalnie podać dane firmy (NIP, nazwa, adres). Gdy podasz prawidłowy NIP, po opłaceniu otrzymasz fakturę VAT; w przeciwnym razie automatycznie wystawimy paragon.',
	shortPayment:
		'Preferujemy przelew bankowy (dane w proformie po zapisie).',
	shortDocument:
		'NIP przy zapisie → faktura VAT; bez NIP → paragon.',
} as const;