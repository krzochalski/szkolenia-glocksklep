import { fireEvent, render, screen } from '@testing-library/react';
import { UiProvider } from '@ui';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { Course } from '@/types/course';
import { CourseCard } from './CourseCard';

const wrap = (ui: ReactElement) => render(<UiProvider>{ui}</UiProvider>);

const course: Course = {
	id: 'c1',
	name: 'Glockatto — podstawy',
	slug: 'glockatto-podstawy',
	description: 'Wprowadzenie do pistoletu.',
	price: 850,
	hours: 8,
	tags: ['Glock', 'Pistolet'],
	level: 'basic',
};

describe('CourseCard', () => {
	it('renders list row with level, program chips, price and details CTA', () => {
		wrap(<CourseCard course={course} />);
		expect(screen.getByText('PODSTAWOWY')).toBeInTheDocument();
		expect(screen.getByText('Glockatto — podstawy')).toBeInTheDocument();
		expect(screen.getByText('8 H')).toBeInTheDocument();
		expect(screen.getByText('Glock')).toBeInTheDocument();
		expect(screen.getByText('850.00PLN')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /szczegóły/i })).toHaveAttribute(
			'href',
			'/szkolenia/glockatto-podstawy'
		);
	});

	it('toggles netto/brutto like Stayfrosty product tiles', () => {
		wrap(<CourseCard course={course} />);
		fireEvent.click(screen.getByRole('button', { name: 'BRUTTO' }));
		expect(screen.getByText('1045.50PLN')).toBeInTheDocument();
	});
});
