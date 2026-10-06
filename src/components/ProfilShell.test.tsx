import { render, screen, within } from '@testing-library/react';
import { UiProvider } from '@ui';
import type { ReactElement } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { setMockPathname } from '@/test-next-nav';
import { ProfilShell } from './ProfilShell';

vi.mock('@hooks', () => ({
	useAuthUser: () => ({
		uid: 'user-1',
		displayName: 'Piotr Krzoska',
		email: 'zamowienia@glocksklep.pl',
	}),
}));

vi.mock('@services/auth', () => ({
	signOut: vi.fn(),
}));

beforeAll(() => {
	class ResizeObserverStub {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

const wrap = (ui: ReactElement) => render(<UiProvider>{ui}</UiProvider>);

describe('ProfilShell', () => {
	it('renders mobile bottom navigation with section links', () => {
		setMockPathname('/profil');
		wrap(
			<ProfilShell>
				<div>content</div>
			</ProfilShell>
		);

		const nav = screen.getByRole('navigation', { name: 'Nawigacja profilu' });
		const bottom = within(nav);
		expect(bottom.getByRole('link', { name: 'Profil' })).toHaveAttribute('href', '/profil');
		expect(bottom.getByRole('link', { name: 'Moje szkolenia' })).toHaveAttribute(
			'href',
			'/profil/moje-szkolenia'
		);
		expect(bottom.getByRole('link', { name: 'Harmonogram' })).toHaveAttribute(
			'href',
			'/profil/harmonogram'
		);
		expect(bottom.getByRole('link', { name: 'Lista oczekujących' })).toHaveAttribute(
			'href',
			'/profil/lista-oczekujacych'
		);
		expect(bottom.getByRole('link', { name: 'Profil' })).toHaveAttribute(
			'aria-current',
			'page'
		);
	});

	it('marks the active profile section from the pathname', () => {
		setMockPathname('/profil/moje-szkolenia/slug/date-1');
		wrap(
			<ProfilShell>
				<div>content</div>
			</ProfilShell>
		);

		const bottom = within(screen.getByRole('navigation', { name: 'Nawigacja profilu' }));
		expect(bottom.getByRole('link', { name: 'Moje szkolenia' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		expect(bottom.getByRole('link', { name: 'Profil' })).not.toHaveAttribute(
			'aria-current'
		);
	});
});
