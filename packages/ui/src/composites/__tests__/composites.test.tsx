import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
	CatalogCard,
	FaqSection,
	PageColumn,
	PriceToggle,
	SiteHeader,
	SiteNavDrawer,
	UiProvider,
} from '../..';

const wrap = (ui: ReactElement) => render(<UiProvider>{ui}</UiProvider>);

describe('CatalogCard', () => {
	it('renders title and CTA', () => {
		wrap(
			<CatalogCard
				eyebrow='GEN 5'
				image={<img alt='x' src='/x.webp' />}
				title='Drop-in'
				price='100.00PLN'
				action={<button type='button'>SZCZEGÓŁY</button>}
			/>
		);
		expect(screen.getByText('GEN 5')).toBeInTheDocument();
		expect(screen.getByText('Drop-in')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'SZCZEGÓŁY' })).toBeInTheDocument();
	});

	it('stamps sold out on the image and drops an empty header', () => {
		wrap(
			<CatalogCard
				soldOutLabel='WYPRZEDANE'
				image={<img alt='x' src='/x.webp' />}
				title='Drop-in'
			/>
		);
		expect(screen.getByText('WYPRZEDANE')).toBeInTheDocument();
		expect(screen.getByText('Drop-in')).toBeInTheDocument();
	});
});

describe('PriceToggle', () => {
	it('marks netto as the active segment', () => {
		wrap(<PriceToggle mode='netto' onChange={() => undefined} />);
		expect(screen.getByRole('button', { name: 'NETTO' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'BRUTTO' })).toBeInTheDocument();
	});
});

describe('SiteHeader', () => {
	it('renders the wordmark, links, and cart', () => {
		wrap(
			<SiteHeader
				brand='GLOCKACCI'
				brandHref='/'
				cartHref='/koszyk'
				cartCount={2}
				cartLabel='Koszyk'
				links={[
					{ href: '/', label: 'Główna', active: true },
					{ href: '/spusty', label: 'Spusty' },
					{ href: 'https://example.com', label: 'External', external: true },
				]}
			/>
		);
		expect(screen.getByText('GLOCKACCI')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Główna' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: 'Spusty' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute('target', '_blank');
		expect(screen.getAllByRole('link', { name: 'Koszyk' })).toHaveLength(2);
	});

	it('hides the cart and accepts a brand node plus actions', () => {
		wrap(
			<SiteHeader
				brand={<img alt='Logo' src='/logo.svg' />}
				links={[{ href: '/docs', label: 'Docs' }]}
				actions={<button type='button'>Account</button>}
				mobileActions={<button type='button'>Search</button>}
			/>
		);
		expect(screen.getByRole('img', { name: 'Logo' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Logo' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Cart' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument();
	});
});

describe('SiteNavDrawer', () => {
	it('renders links, a custom head, and a footer', () => {
		wrap(
			<SiteNavDrawer
				open
				onClose={() => undefined}
				title='Navigation'
				footer={<button type='button'>Sign in</button>}
				links={[{ href: '/faq', label: 'FAQ', active: true }]}
			/>
		);
		expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
		expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
	});

	it('renders nothing while closed', () => {
		wrap(<SiteNavDrawer open={false} onClose={() => undefined} links={[]} />);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});

describe('PageColumn', () => {
	it('renders children in an xl container', () => {
		const { container } = wrap(<PageColumn>Body</PageColumn>);
		expect(screen.getByText('Body')).toBeInTheDocument();
		expect(container.querySelector('.MuiContainer-maxWidthXl')).toBeTruthy();
	});
});

describe('FaqSection', () => {
	it('renders questions', () => {
		wrap(<FaqSection items={[{ title: 'Q1', content: 'A1' }]} title='FAQ' />);
		expect(screen.getByText('FAQ')).toBeInTheDocument();
		expect(screen.getByText('Q1')).toBeInTheDocument();
	});
});
