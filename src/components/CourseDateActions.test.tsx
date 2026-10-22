import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { UiProvider } from '@ui';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Course, CourseClass } from '@/types/course';
import { CourseDateActions } from './CourseDateActions';

const authUserMock = vi.fn(() => null as { uid: string } | null);
const eligibilityMock = vi.fn(() => ({
	hasPrerequisites: false,
	eligible: true,
	loading: false,
	prerequisiteNames: [] as string[],
	missingNames: [] as string[],
}));

vi.mock('@hooks', () => ({
	useAuthUser: () => authUserMock(),
	useCourseEligibility: () => eligibilityMock(),
}));

vi.mock('@services/courses', () => ({
	enrollInCourse: vi.fn(),
	getCourses: vi.fn(async () => []),
}));

vi.mock('@services/courseCompletions', () => ({
	getMyCourseCompletions: vi.fn(async () => []),
}));

vi.mock('@services/courseWaitingList', () => ({
	addToWaitingList: vi.fn(),
	getUserWaitingListEntries: vi.fn(async () => []),
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
		authUserMock.mockReturnValue(null);
		eligibilityMock.mockReturnValue({
			hasPrerequisites: false,
			eligible: true,
			loading: false,
			prerequisiteNames: [],
			missingNames: [],
		});
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
			screen.getByText(
				/Movement Fundamentals, 18 października 2026, 10:00, Strzelnica Czacz, 500 zł netto \/ 615 zł brutto/
			)
		).toBeInTheDocument();
	});

	it('shows prerequisite lock instead of enroll when logged in but ineligible', () => {
		authUserMock.mockReturnValue({ uid: 'u1' });
		eligibilityMock.mockReturnValue({
			hasPrerequisites: true,
			eligible: false,
			loading: false,
			prerequisiteNames: ['Pistolet podstawowy'],
			missingNames: ['Pistolet podstawowy'],
		});
		wrap(
			<CourseDateActions
				course={{
					...course,
					kind: 'practice',
					prerequisiteCourseIds: ['prereq-1'],
				}}
				date={date}
			/>
		);

		expect(screen.getByText(/Wymaga ukończenia: Pistolet podstawowy/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Zapisz się' })).not.toBeInTheDocument();
	});
});
