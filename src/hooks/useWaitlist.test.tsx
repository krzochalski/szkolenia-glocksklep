import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import { WAITLIST_JOIN_ERROR } from '@/utils/waitlistErrors';
import { useWaitlist } from './useWaitlist';

const authUserMock = vi.fn(() => ({
	uid: 'uid1',
	displayName: 'Ada',
	email: 'ada@example.com',
	phoneNumber: null as string | null,
}));

vi.mock('./useAuthUser', () => ({
	useAuthUser: () => authUserMock(),
}));

const addToWaitingList = vi.fn<(...args: unknown[]) => Promise<'created' | 'exists'>>();
const removeFromWaitingList = vi.fn<(...args: unknown[]) => Promise<void>>();
const getUserWaitingListEntries = vi.fn<(...args: unknown[]) => Promise<CourseWaitingListEntry[]>>();

vi.mock('@services/courseWaitingList', () => ({
	addToWaitingList: (params: unknown) => addToWaitingList(params),
	removeFromWaitingList: (courseId: string, userId: string) =>
		removeFromWaitingList(courseId, userId),
	getUserWaitingListEntries: (userId: string) => getUserWaitingListEntries(userId),
	ALREADY_ON_WAITING_LIST: 'Jesteś już na liście oczekujących tego szkolenia.',
}));

vi.mock('@services/users', () => ({
	getUserProfile: vi.fn(async () => ({
		displayName: 'Ada',
		email: 'ada@example.com',
		phoneNumber: undefined,
	})),
}));

vi.mock('@/utils/invalidateCourseQueries', () => ({
	invalidateCourseQueries: vi.fn(async () => undefined),
}));

const course = {
	id: 'courseBezstrzalowy',
	name: 'Trening Bezstrzałowy',
	slug: 'trening-bezstrzalowy',
};

const wrap =
	(client: QueryClient) =>
	({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);

describe('useWaitlist', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authUserMock.mockReturnValue({
			uid: 'uid1',
			displayName: 'Ada',
			email: 'ada@example.com',
			phoneNumber: null,
		});
		getUserWaitingListEntries.mockResolvedValue([]);
	});

	it('reports isJoined from waiting list entries', async () => {
		getUserWaitingListEntries.mockResolvedValue([
			{
				id: 'courseBezstrzalowy_uid1',
				courseId: 'courseBezstrzalowy',
				courseName: 'Trening Bezstrzałowy',
				courseSlug: 'trening-bezstrzalowy',
				userId: 'uid1',
				userName: 'Ada',
				email: 'ada@example.com',
				createdAt: '2026-11-23T10:00:00.000Z',
				consentAt: '2026-11-23T10:00:00.000Z',
			},
		]);
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const { result } = renderHook(() => useWaitlist(course), { wrapper: wrap(client) });
		await waitFor(() => expect(result.current.isJoined).toBe(true));
	});

	it('maps permission-denied on join to Polish message', async () => {
		const onError = vi.fn();
		addToWaitingList.mockRejectedValue(
			Object.assign(new Error('Missing or insufficient permissions.'), {
				code: 'permission-denied',
			})
		);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const { result } = renderHook(() => useWaitlist(course, { onError }), {
			wrapper: wrap(client),
		});
		await act(async () => {
			result.current.join();
		});
		await waitFor(() => expect(onError).toHaveBeenCalledWith(WAITLIST_JOIN_ERROR));
	});

	it('notifies onJoined with created', async () => {
		const onJoined = vi.fn();
		addToWaitingList.mockResolvedValue('created');
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const { result } = renderHook(() => useWaitlist(course, { onJoined }), {
			wrapper: wrap(client),
		});
		await act(async () => {
			result.current.join();
		});
		await waitFor(() => expect(onJoined).toHaveBeenCalledWith('created'));
	});
});
