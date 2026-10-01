export const SITE_ORIGIN = 'https://szkolenia.glocksklep.pl';
export const SITE_NAME = 'GLOCKSKLEP Szkolenia';
export const SITE_LANG = 'pl';
export const OG_LOCALE = 'pl_PL';
export const DEFAULT_OG_IMAGE_PATH = '/og/home.jpg';
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

export const STATIC_SEO: Record<StaticSeoPage, StaticSeoConfig> = {
	home: {
		title: DEFAULT_TITLE,
		description: DEFAULT_DESCRIPTION,
		path: '/',
		ogType: 'website',
	},
	nearest: {
		title: `Najbliższe szkolenia | ${SITE_NAME}`,
		description:
			'Najbliższe terminy szkoleń strzeleckich Glocksklep — wolne miejsca i zapisy online.',
		path: '/najblizsze-szkolenia',
	},
	courses: {
		title: `Szkolenia | ${SITE_NAME}`,
		description:
			'Katalog szkoleń strzeleckich Glocksklep: poziomy, programy i aktualne terminy.',
		path: '/szkolenia',
	},
	faq: {
		title: `FAQ | ${SITE_NAME}`,
		description: 'Najczęstsze pytania o szkolenia, zapisy, płatności i wymagania uczestników.',
		path: '/faq',
	},
	sciezkaRozwoju: {
		title: `Ścieżka rozwoju | ${SITE_NAME}`,
		description:
			'Zalecana kolejność szkoleń strzeleckich Glocksklep — od podstaw do ruchu i soft skills.',
		path: '/sciezka-rozwoju',
	},
	about: {
		title: `O nas | ${SITE_NAME}`,
		description: 'Instruktorzy i filozofia szkoleń strzeleckich Glocksklep.',
		path: '/o-nas',
	},
	regulamin: {
		title: `Regulamin | ${SITE_NAME}`,
		description: 'Regulamin uczestnictwa w szkoleniach strzeleckich Glocksklep.',
		path: '/regulamin',
	},
	login: {
		title: `Logowanie | ${SITE_NAME}`,
		description: 'Zaloguj się do panelu uczestnika.',
		path: '/login',
		noindex: true,
	},
	register: {
		title: `Rejestracja | ${SITE_NAME}`,
		description: 'Załóż konto uczestnika szkoleń.',
		path: '/register',
		noindex: true,
	},
	auth: {
		title: `Autoryzacja | ${SITE_NAME}`,
		description: 'Dokończenie logowania.',
		path: '/auth/email-link',
		noindex: true,
	},
	profil: {
		title: `Profil | ${SITE_NAME}`,
		description: 'Panel uczestnika.',
		path: '/profil',
		noindex: true,
	},
	admin: {
		title: `Admin | ${SITE_NAME}`,
		description: 'Panel administracyjny.',
		path: '/admin',
		noindex: true,
	},
	notFound: {
		title: `Nie znaleziono | ${SITE_NAME}`,
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
];

export const Links = {
	shop: 'https://glocksklep.pl',
	about: 'https://glocksklep.pl/o-mnie',
	instagram: 'https://www.instagram.com/',
	youtube: 'https://www.youtube.com/',
};
