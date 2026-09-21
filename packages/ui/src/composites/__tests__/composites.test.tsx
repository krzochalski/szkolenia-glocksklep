import { render, screen } from '@testing-library/react';
import { CatalogCard, ConfirmDialog, FaqSection, PriceToggle, UiProvider } from '../..';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

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
		expect(screen.getByText('Drop-in')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'SZCZEGÓŁY' })).toBeInTheDocument();
	});
});

describe('PriceToggle', () => {
	it('marks netto as the active segment', () => {
		wrap(<PriceToggle mode='netto' onChange={() => undefined} />);
		expect(screen.getByRole('button', { name: 'NETTO' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'BRUTTO' })).toBeInTheDocument();
	});
});

describe('FaqSection', () => {
	it('renders questions', () => {
		wrap(<FaqSection items={[{ title: 'Q1', content: 'A1' }]} title='FAQ' />);
		expect(screen.getByText('FAQ')).toBeInTheDocument();
		expect(screen.getByText('Q1')).toBeInTheDocument();
	});
});

describe('ConfirmDialog', () => {
	it('renders title and confirm action when open', () => {
		wrap(
			<ConfirmDialog
				open
				title='Delete item'
				cancelLabel='Cancel'
				confirmLabel='Delete'
				onCancel={() => undefined}
				onConfirm={() => undefined}
			>
				This cannot be undone.
			</ConfirmDialog>
		);
		expect(screen.getByText('Delete item')).toBeInTheDocument();
		expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});
});
