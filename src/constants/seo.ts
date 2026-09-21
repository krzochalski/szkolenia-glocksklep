export const SITE_ORIGIN = 'https://szkolenia.glocksklep.pl';
export const SITE_NAME = 'Szkolenia Glocksklep';
export const SITE_LANG = 'pl';
export const OG_LOCALE = 'pl_PL';
export const DEFAULT_OG_IMAGE_PATH = '/og-default.webp';
export const META_DESCRIPTION_MAX = 160;
export const META_TITLE_MAX = 120;

export const DEFAULT_TITLE = 'Szkolenia Glocksklep — trening strzelecki i zapisy';
export const DEFAULT_DESCRIPTION =
	'Szkolenia strzeleckie Glocksklep: terminy, zapisy online, instruktorzy i materiały dla uczestników.';

export type StaticSeoPage =
	| 'home'
	| 'nearest'
	| 'courses'
	| 'faq'
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
		title: 'Najbliższe szkolenia | Szkolenia Glocksklep',
		description:
			'Najbliższe terminy szkoleń strzeleckich Glocksklep — wolne miejsca i zapisy online.',
		path: '/najblizsze-szkolenia',
	},
	courses: {
		title: 'Szkolenia | Szkolenia Glocksklep',
		description:
			'Katalog szkoleń strzeleckich Glocksklep: poziomy, programy i aktualne terminy.',
		path: '/szkolenia',
	},
	faq: {
		title: 'FAQ | Szkolenia Glocksklep',
		description: 'Najczęstsze pytania o szkolenia, zapisy, płatności i wymagania uczestników.',
		path: '/faq',
	},
	about: {
		title: 'O nas | Szkolenia Glocksklep',
		description: 'Instruktorzy i filozofia szkoleń strzeleckich Glocksklep.',
		path: '/o-nas',
	},
	regulamin: {
		title: 'Regulamin | Szkolenia Glocksklep',
		description: 'Regulamin uczestnictwa w szkoleniach strzeleckich Glocksklep.',
		path: '/regulamin',
	},
	login: {
		title: 'Logowanie | Szkolenia Glocksklep',
		description: 'Zaloguj się do panelu uczestnika.',
		path: '/login',
		noindex: true,
	},
	register: {
		title: 'Rejestracja | Szkolenia Glocksklep',
		description: 'Załóż konto uczestnika szkoleń.',
		path: '/register',
		noindex: true,
	},
	auth: {
		title: 'Autoryzacja | Szkolenia Glocksklep',
		description: 'Dokończenie logowania.',
		path: '/auth/email-link',
		noindex: true,
	},
	profil: {
		title: 'Profil | Szkolenia Glocksklep',
		description: 'Panel uczestnika.',
		path: '/profil',
		noindex: true,
	},
	admin: {
		title: 'Admin | Szkolenia Glocksklep',
		description: 'Panel administracyjny.',
		path: '/admin',
		noindex: true,
	},
	notFound: {
		title: 'Nie znaleziono | Szkolenia Glocksklep',
		description: 'Ta strona nie istnieje.',
		path: '/404',
		noindex: true,
	},
};

export const SITEMAP_STATIC_PATHS: readonly string[] = [
	'/',
	'/najblizsze-szkolenia',
	'/szkolenia',
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
