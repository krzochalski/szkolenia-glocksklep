import { render, screen } from '@testing-library/react';
import { UiProvider } from '@ui';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { Course, CourseClass } from '@/types/course';
import { CourseDateRow } from './CourseDateRow';

const course: Course = {
	id: 'c1',
	name: 'Movement Fundamentals',
	slug: 'movement-fundamentals',
	description: 'Opis',
	price: 500,
	hours: 4,
	tags: [],
	level: 'intermediate',
};

const date: CourseClass = {
	id: 'd1',
	date: '2026-10-18',
	timeStart: '10:00',
	slotsMax: 8,
	participants: [{ id: 'u1', name: 'Ada', email: 'a@b.c' }],
	instructor: { id: 'i1', name: 'Piotr "Glockacci" Krzoska', slug: 'piotr', bio: '' },
	place: {
		id: 'p1',
		name: 'Strzelnica Czacz',
		slug: 'czacz',
		googleMapsLink: '',
	},
};

const wrap = (ui: ReactElement) => render(<UiProvider>{ui}</UiProvider>);

describe('CourseDateRow', () => {
	it('renders title, Polish meta, price, and action in separate blocks', () => {
		wrap(<CourseDateRow course={course} date={date} action={<span>Zapisano</span>} />);

		expect(screen.getByRole('link', { name: 'Movement Fundamentals' })).toHaveAttribute(
			'href',
			'/szkolenia/movement-fundamentals'
		);
		expect(
			screen.getByText('18 października 2026 · 10:00 · Strzelnica Czacz · wolne: 7')
		).toBeInTheDocument();
		expect(screen.getByText('500 zł')).toBeInTheDocument();
		expect(screen.getByText('Zapisano')).toBeInTheDocument();
		expect(screen.queryByText(/wolne: 4500/)).toBeNull();
	});

	it('can hide slots and use a custom title href', () => {
		wrap(
			<CourseDateRow
				course={course}
				date={date}
				showSlots={false}
				titleHref='/profil/moje-szkolenia/movement-fundamentals/d1'
				action={<a href='/proforma'>Proforma</a>}
			/>
		);

		expect(screen.getByRole('link', { name: 'Movement Fundamentals' })).toHaveAttribute(
			'href',
			'/profil/moje-szkolenia/movement-fundamentals/d1'
		);
		expect(screen.getByText('18 października 2026 · 10:00 · Strzelnica Czacz')).toBeInTheDocument();
		expect(screen.queryByText(/wolne:/)).toBeNull();
		expect(screen.getByRole('link', { name: 'Proforma' })).toBeInTheDocument();
	});

	it('supports course-detail rows without title and with instructor', () => {
		wrap(
			<CourseDateRow
				course={course}
				date={date}
				showTitle={false}
				showInstructor
				action={<span>Zapisano</span>}
			/>
		);

		expect(screen.getByText('18 października 2026 · 10:00')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Strzelnica Czacz · instruktor: Piotr "Glockacci" Krzoska · wolne: 7'
			)
		).toBeInTheDocument();
		expect(screen.getByText('500 zł')).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Movement Fundamentals' })).toBeNull();
	});
});
