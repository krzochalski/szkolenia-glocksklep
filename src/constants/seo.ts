import { SOCIAL_LINKS } from './contact';

export const SITE_ORIGIN = 'https://szkolenia.glocksklep.pl';
export const SITE_NAME = 'GLOCKSKLEP Szkolenia';
export const SITE_LANG = 'pl';
export const OG_LOCALE = 'pl_PL';
export const DEFAULT_OG_IMAGE_PATH = '/og/home.webp';
export const META_DESCRIPTION_MAX = 160;
export const META_TITLE_MAX = 120;

export const DEFAULT_TITLE = 'GLOCKSKLEP Szkolenia — trening strzelecki i zapisy';
export const DEFAULT_DESCRIPTION =
	'Szkolenia strzeleckie Glocksklep: terminy, zapisy online, instruktorzy i materiały dla uczestników.';

export type StaticSeoPage =
	| 'home'
	| 'nearest'
	| 'courses'
	| 'faq'
	| 'sciezkaRozwoju'
	| 'about'
	| 'regulamin'
	| 'privacyPolicy'
	| 'cookiesPolicy'
	| 'login'
	| 'register'
	| 'auth'
	| 'profil'
	| 'admin'
	| 'notFound';

export type StaticSeoConfig = {
	readonly title: string;
	readonly description: string;
	readonly path: string;
	readonly noindex?: boolean;
	readonly ogType?: 'website';
};

/** Page title segments only — layout template appends `| ${SITE_NAME}` once. */
export const STATIC_SEO: Record<StaticSeoPage, StaticSeoConfig> = {
	home: {
		title: DEFAULT_TITLE,
		description: DEFAULT_DESCRIPTION,
		path: '/',
		ogType: 'website',
	},
	nearest: {
		title: 'Najbliższe szkolenia',
		description:
			'Najbliższe terminy szkoleń strzeleckich Glocksklep — wolne miejsca i zapisy online.',
		path: '/najblizsze-szkolenia',
	},
	courses: {
		title: 'Szkolenia',
		description:
			'Katalog szkoleń strzeleckich Glocksklep: poziomy, programy i aktualne terminy.',
		path: '/szkolenia',
	},
	faq: {
		title: 'Najczęściej zadawane pytania',
		description: 'Najczęstsze pytania o szkolenia, zapisy, płatności i wymagania uczestników.',
		path: '/faq',
	},
	sciezkaRozwoju: {
		title: 'Ścieżka rozwoju',
		description:
			'Zalecana kolejność szkoleń strzeleckich Glocksklep — od podstaw do ruchu i soft skills.',
		path: '/sciezka-rozwoju',
	},
	about: {
		title: 'O nas',
		description:
			'Piotr „Glockacci” Krzoska — instruktor i zawodnik IPSC, IDPA i PiRO. Historia, osiągnięcia i podejście do szkoleń strzeleckich.',
		path: '/o-nas',
	},
	regulamin: {
		title: 'Regulamin',
		description: 'Regulamin uczestnictwa w szkoleniach strzeleckich Glocksklep.',
		path: '/regulamin',
	},
	privacyPolicy: {
		title: 'Polityka prywatności',
		description: 'Polityka prywatności i informacje o przetwarzaniu danych osobowych.',
		path: '/polityka-prywatnosci',
	},
	cookiesPolicy: {
		title: 'Polityka cookies',
		description: 'Informacje o plikach cookie i podobnych technologiach w Serwisie.',
		path: '/polityka-cookies',
	},
	login: {
		title: 'Logowanie',
		description: 'Zaloguj się do panelu uczestnika.',
		path: '/login',
		noindex: true,
	},
	register: {
		title: 'Rejestracja',
		description: 'Załóż konto uczestnika szkoleń.',
		path: '/register',
		noindex: true,
	},
	auth: {
		title: 'Autoryzacja',
		description: 'Dokończenie logowania.',
		path: '/auth/email-link',
		noindex: true,
	},
	profil: {
		title: 'Profil',
		description: 'Panel uczestnika.',
		path: '/profil',
		noindex: true,
	},
	admin: {
		title: 'Admin',
		description: 'Panel administracyjny.',
		path: '/admin',
		noindex: true,
	},
	notFound: {
		title: 'Nie znaleziono',
		description: 'Ta strona nie istnieje.',
		path: '/404',
		noindex: true,
	},
};

export const SITEMAP_STATIC_PATHS: readonly string[] = [
	'/',
	'/najblizsze-szkolenia',
	'/szkolenia',
	'/sciezka-rozwoju',
	'/faq',
	'/o-nas',
	'/regulamin',
	'/polityka-prywatnosci',
	'/polityka-cookies',
];

export const Links = {
	shop: 'https://glocksklep.pl',
	about: 'https://glocksklep.pl/o-mnie',
	instagram: SOCIAL_LINKS.instagram,
	youtube: SOCIAL_LINKS.youtube,
};
