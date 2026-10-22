import { render, screen } from '@testing-library/react';
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
	it('renders list row with level, program chips, dual price and details CTA', () => {
		wrap(<CourseCard course={course} />);
		expect(screen.getByText('PODSTAWOWY')).toBeInTheDocument();
		expect(screen.getByText('Glockatto — podstawy')).toBeInTheDocument();
		expect(screen.getByText('8 H')).toBeInTheDocument();
		expect(screen.getByText('Glock')).toBeInTheDocument();
		expect(screen.getByText('850 zł netto / 1045.50 zł brutto')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /szczegóły/i })).toHaveAttribute(
			'href',
			'/szkolenia/glockatto-podstawy'
		);
	});

	it('shows practice eyebrow and prerequisite line', () => {
		wrap(
			<CourseCard
				course={{ ...course, kind: 'practice' }}
				prerequisiteNames={['Pistolet podstawowy']}
			/>
		);
		expect(screen.getByText('TRENING · PODSTAWOWY')).toBeInTheDocument();
		expect(screen.getByText('Wymaga ukończenia: Pistolet podstawowy')).toBeInTheDocument();
	});
});
