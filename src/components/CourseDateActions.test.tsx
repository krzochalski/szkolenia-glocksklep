import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { UiProvider } from '@ui';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Course, CourseClass } from '@/types/course';
import { CourseDateActions } from './CourseDateActions';

vi.mock('@hooks', () => ({
	useAuthUser: () => null,
}));

vi.mock('@services/courses', () => ({
	enrollInCourse: vi.fn(),
}));

vi.mock('@services/courseWaitingList', () => ({
	addToWaitingList: vi.fn(),
	getUserWaitingListEntries: vi.fn(),
	removeFromWaitingList: vi.fn(),
}));

vi.mock('@services/users', () => ({
	getUserProfile: vi.fn(),
}));

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
	participants: [],
	instructor: { id: 'i1', name: 'Piotr', slug: 'piotr', bio: '' },
	place: {
		id: 'p1',
		name: 'Strzelnica Czacz',
		slug: 'czacz',
		googleMapsLink: '',
	},
};

const wrap = (ui: ReactElement) => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<UiProvider>{ui}</UiProvider>
		</QueryClientProvider>
	);
};

describe('CourseDateActions', () => {
	it('passes redirect and termin on auth gate login/register links', () => {
		wrap(<CourseDateActions course={course} date={date} />);

		fireEvent.click(screen.getByRole('button', { name: 'Zapisz się' }));

		expect(screen.getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute(
			'href',
			'/login?redirect=%2Fszkolenia%2Fmovement-fundamentals&termin=d1'
		);
		expect(screen.getByRole('link', { name: 'Załóż konto' })).toHaveAttribute(
			'href',
			'/register?redirect=%2Fszkolenia%2Fmovement-fundamentals&termin=d1'
		);
		expect(
			screen.getByText(/Movement Fundamentals, 18 października 2026, 10:00, Strzelnica Czacz, 500 zł/)
		).toBeInTheDocument();
	});
});
