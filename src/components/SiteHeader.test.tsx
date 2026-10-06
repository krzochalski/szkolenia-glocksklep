import { fireEvent, render, screen } from '@testing-library/react';
import { UiProvider } from '@ui';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { setMockPathname } from '@/test-next-nav';
import { SiteHeader } from './SiteHeader';

vi.mock('@hooks', () => ({
	useAuthUser: () => null,
}));

vi.mock('@services/auth', () => ({
	signOut: vi.fn(),
}));

const wrap = (ui: ReactElement) => render(<UiProvider>{ui}</UiProvider>);

describe('SiteHeader', () => {
	it('renders the GLOCKSKLEP wordmark, Szkolenia sublabel, and Stayfrosty nav links', () => {
		wrap(<SiteHeader />);
		expect(screen.getByText('GLOCKSKLEP')).toBeInTheDocument();
		expect(screen.getAllByText('Szkolenia').length).toBeGreaterThan(0);
		expect(screen.getByRole('link', { name: 'Główna' })).toHaveAttribute('href', '/');
		expect(screen.getByRole('link', { name: 'Szkolenia' })).toHaveAttribute('href', '/szkolenia');
		expect(screen.getByRole('link', { name: 'Ścieżka rozwoju' })).toHaveAttribute(
			'href',
			'/sciezka-rozwoju'
		);
		const about = screen.getByRole('link', { name: 'O nas' });
		expect(about).toHaveAttribute('href', 'https://glocksklep.pl/o-mnie');
		expect(about).toHaveAttribute('target', '_blank');
		expect(about).toHaveAttribute('rel', 'noreferrer');
		expect(about.querySelector('svg')).toBeTruthy();
		expect(screen.queryByRole('link', { name: 'Kontakt' })).toBeNull();
		const profileLinks = screen.getAllByRole('link', { name: 'Zaloguj' });
		expect(profileLinks.length).toBeGreaterThan(0);
		expect(profileLinks[0]).toHaveAttribute('href', '/login?redirect=%2Fprofil');
	});

	it('marks the current section as active', () => {
		setMockPathname('/szkolenia/pistol-basic-course');
		wrap(<SiteHeader />);
		expect(screen.getByRole('link', { name: 'Szkolenia' })).toHaveAttribute('aria-current', 'page');
	});

	it('opens the mobile drawer', () => {
		wrap(<SiteHeader />);
		expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Otwórz nawigację' }));
		const menu = screen.getByRole('dialog', { name: 'Menu' });
		expect(menu).toBeInTheDocument();
		expect(menu.querySelector('a[href="/login"]')).toHaveAttribute('href', '/login');
	});
});

