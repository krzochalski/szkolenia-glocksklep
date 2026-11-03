/** Placeholders for admin class-date participant emails (camelCase). */
export const DATE_NOTIFY_PLACEHOLDERS = [
	{ key: 'firstName', label: 'imię uczestnika' },
	{ key: 'courseName', label: 'nazwa kursu' },
	{ key: 'level', label: 'poziom' },
	{ key: 'date', label: 'data zajęć' },
	{ key: 'time', label: 'godzina' },
	{ key: 'location', label: 'miejsce' },
	{ key: 'mapLink', label: 'link do mapy' },
	{ key: 'instructor', label: 'instruktor' },
	{ key: 'requirements', label: 'wymagania / co zabrać' },
	{ key: 'price', label: 'cena brutto' },
	{ key: 'paymentStatus', label: 'status płatności' },
	{ key: 'panelLink', label: 'link do panelu' },
	{ key: 'minimumInfo', label: 'minimum uczestników' },
	{ key: 'cancellationInfo', label: 'zasady rezygnacji' },
	{ key: 'contact', label: 'kontakt organizatora' },
] as const;

export type DateNotifyPlaceholderKey = (typeof DATE_NOTIFY_PLACEHOLDERS)[number]['key'];

export const DATE_NOTIFY_PLACEHOLDER_KEYS: readonly DateNotifyPlaceholderKey[] =
	DATE_NOTIFY_PLACEHOLDERS.map((p) => p.key);

/**
 * Regulamin VIII resign/refund window — keep in sync with
 * `DEFAULT_REGULAMIN_MD` §VIII.3 (3 full days before the session date).
 */
export const DATE_NOTIFY_CANCELLATION_INFO =
	'Rezygnacja ze zwrotem 100% wpłaty jest możliwa najpóźniej 3 pełne dni przed datą Terminu. Późniejsza rezygnacja nie uprawnia do zwrotu. Wypis z Terminu jest zawsze dostępny w panelu uczestnika; skutki finansowe wynikają z Regulaminu.';

export const DEFAULT_DATE_NOTIFY_SUBJECT =
	'{{courseName}} — {{date}}: informacje o zajęciach';

export const DEFAULT_DATE_NOTIFY_BODY_MARKDOWN = [
	'Cześć {{firstName}},',
	'',
	'<!-- tu możesz dopisać własną wiadomość -->',
	'',
	'## Szczegóły zajęć',
	'',
	'- **Kurs:** {{courseName}} ({{level}})',
	'- **Data:** {{date}}',
	'- **Godzina:** {{time}}',
	'- **Miejsce:** {{location}}',
	'- **Mapa:** {{mapLink}}',
	'- **Instruktor:** {{instructor}}',
	'- **Co zabrać / wymagania:** {{requirements}}',
	'',
	'## Płatność',
	'',
	'- **Cena:** {{price}}',
	'- **Status:** {{paymentStatus}}',
	'',
	'## Ważne zasady',
	'',
	'{{minimumInfo}}',
	'',
	'{{cancellationInfo}}',
	'',
	'## Kontakt',
	'',
	'{{contact}}',
	'',
	'Twój panel: {{panelLink}}',
	'',
	'Pozdrawiamy,',
	'GLOCKSKLEP Szkolenia',
].join('\n');
