import { Paths } from './paths';

export type NavItem = {
	readonly label: string;
	readonly path: string;
};

export const navigationItems: readonly NavItem[] = [
	{ label: 'Główna', path: Paths.home },
	{ label: 'Szkolenia', path: Paths.courses },
	{ label: 'Najbliższe', path: Paths.najblizszeSzkolenia },
	{ label: 'FAQ', path: Paths.faq },
	{ label: 'O nas', path: Paths.oNas },
	{ label: 'Kontakt', path: Paths.kontakt },
];

export const isCurrentPath = (pathname: string, path: string): boolean => {
	if (path === Paths.home) return pathname === Paths.home;
	return pathname === path || pathname.startsWith(`${path}/`);
};
