import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UiProvider } from '@ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCourseDateNewView } from './AdminCourseDateNewView';

const push = vi.fn();
const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push }),
	useSearchParams: () => searchParams,
}));

vi.mock('@services/courses', () => ({
	getCourse: vi.fn(async () => ({
		id: 'c1',
		name: 'Trening Bezstrzałowy',
		slug: 'trening-bezstrzalowy',
		price: 100,
		dates: [
			{
				id: 'src-date',
				date: '2025-01-10',
				timeStart: '18:00',
				slotsMax: 4,
				minParticipants: 3,
				minDecisionBy: '2025-01-03',
				subtitle: 'dry-fire',
				participants: [{ id: 'u1', name: 'Ada', email: 'a@b.c' }],
				canceled: true,
				waitlistNotifiedAt: '2026-01-01T00:00:00.000Z',
				instructor: { id: 'i1', name: 'Piotr', slug: 'piotr', bio: '' },
				place: { id: 'p1', name: 'Rankor', slug: 'rankor', googleMapsLink: '' },
			},
		],
	})),
	updateCourseDates: vi.fn(async () => {
		throw new Error('updateCourseDates must not be called on open');
	}),
}));

vi.mock('@services/instructors', () => ({
	getInstructors: vi.fn(async () => [
		{ id: 'i1', name: 'Piotr', slug: 'piotr', bio: '' },
	]),
}));

vi.mock('@services/places', () => ({
	getPlaces: vi.fn(async () => [
		{ id: 'p1', name: 'Rankor', slug: 'rankor', googleMapsLink: '' },
	]),
}));

describe('AdminCourseDateNewView prefill from clone', () => {
	beforeEach(() => {
		searchParams.set('from', 'src-date');
		push.mockReset();
	});

	it('opens prefilled create form without saving', async () => {
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		render(
			<UiProvider>
				<QueryClientProvider client={client}>
					<AdminCourseDateNewView courseId='c1' />
				</QueryClientProvider>
			</UiProvider>
		);

		expect(
			await screen.findByRole('heading', { name: /Nowy termin \(na podstawie 2025-01-10\)/i })
		).toBeInTheDocument();
		expect(screen.getByDisplayValue('18:00')).toBeInTheDocument();
		expect(screen.getByDisplayValue('dry-fire')).toBeInTheDocument();
		const { updateCourseDates } = await import('@services/courses');
		expect(updateCourseDates).not.toHaveBeenCalled();
	});
});
