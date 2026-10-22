import { Paths } from './paths';

export type AdminNavItem = {
	readonly id: string;
	readonly label: string;
	readonly href: string;
};

/** Default admin sidebar order. `id` is stable for persisted menu order. */
export const ADMIN_NAV: readonly AdminNavItem[] = [
	{ id: 'nearest-dates', label: 'Najbliższe terminy', href: Paths.adminNearestDates },
	{ id: 'courses', label: 'Szkolenia', href: Paths.adminCourses },
	{ id: 'participants', label: 'Uczestnicy', href: Paths.adminParticipants },
	{ id: 'waiting-list', label: 'Lista oczekujących', href: Paths.adminWaitingList },
	{ id: 'contact-requests', label: 'Zgłoszenia kontaktu', href: Paths.adminContactRequests },
	{ id: 'course-descriptions', label: 'Opisy szkoleń', href: Paths.adminCourseDescriptions },
	{ id: 'billing-data', label: 'Dane rozliczeniowe', href: Paths.adminBillingData },
	{ id: 'faq', label: 'FAQ', href: Paths.adminFaq },
	{ id: 'regulamin', label: 'Regulamin', href: Paths.adminRegulamin },
	{ id: 'privacy-policy', label: 'Polityka prywatności', href: Paths.adminPrivacyPolicy },
	{ id: 'cookies-policy', label: 'Polityka cookies', href: Paths.adminCookiesPolicy },
	{ id: 'homepage', label: 'Strona główna', href: Paths.adminHomepage },
	{ id: 'enrollment-email', label: 'Szablony e-mail', href: Paths.adminEnrollmentEmail },
	{ id: 'sciezka-rozwoju', label: 'Ścieżka rozwoju', href: Paths.adminSciezkaRozwoju },
	{ id: 'debriefing', label: 'Debriefing', href: Paths.adminDebriefings },
	{ id: 'odznaki', label: 'Odznaki', href: Paths.adminOdznaki },
	{ id: 'places', label: 'Obiekty', href: Paths.adminPlaces },
	{ id: 'tags', label: 'Tagi', href: Paths.adminTags },
] as const;

export const ADMIN_NAV_IDS = ADMIN_NAV.map((item) => item.id);
