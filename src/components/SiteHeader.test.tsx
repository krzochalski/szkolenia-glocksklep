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
	it('renders the GlockSklep wordmark, SZKOLENIA sublabel, and Stayfrosty nav links', () => {
		wrap(<SiteHeader />);
		expect(screen.getByText('GlockSklep')).toBeInTheDocument();
		expect(screen.getByText('SZKOLENIA')).toBeInTheDocument();
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
		expect(screen.getAllByRole('link', { name: 'Profil' }).length).toBeGreaterThan(0);
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
		expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Zaloguj' })).toHaveAttribute('href', '/login');
	});
});
