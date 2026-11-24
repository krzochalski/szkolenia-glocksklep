'use client';

import {
	ALREADY_ON_WAITING_LIST,
	addToWaitingList,
	getUserWaitingListEntries,
	removeFromWaitingList,
} from '@services/courseWaitingList';
import { getUserProfile } from '@services/users';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Course } from '@/types/course';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import {
	mapWaitlistError,
	WAITLIST_JOIN_ERROR,
	WAITLIST_LEAVE_ERROR,
} from '@/utils/waitlistErrors';
import { useAuthUser } from './useAuthUser';

type CourseRef = Pick<Course, 'id' | 'name' | 'slug'>;

type Options = {
	readonly onError?: (message: string) => void;
	readonly onJoined?: (result: 'created' | 'exists') => void;
	readonly onLeft?: () => void;
};

/**
 * Shared join/leave/isJoined for course-level waitlist across all entry points.
 */
export const useWaitlist = (course: CourseRef, options: Options = {}) => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const uid = user?.uid;
	const { onError, onJoined, onLeft } = options;

	const waitingQuery = useQuery({
		queryKey: ['waitingList', uid],
		queryFn: () => {
			if (!uid) return Promise.resolve([]);
			return getUserWaitingListEntries(uid);
		},
		enabled: Boolean(uid),
	});

	const isJoined = waitingQuery.data?.some((entry) => entry.courseId === course.id) ?? false;

	const join = useMutation({
		mutationFn: async () => {
			if (!user) throw new Error('Zaloguj się, aby dołączyć do listy oczekujących.');
			const profile = await getUserProfile();
			return addToWaitingList({
				courseId: course.id,
				courseName: course.name,
				courseSlug: course.slug,
				userId: user.uid,
				userName: profile?.displayName || user.displayName || user.email || 'Uczestnik',
				email: profile?.email || user.email || '',
				phoneNumber: profile?.phoneNumber ?? user.phoneNumber ?? undefined,
			});
		},
		onSuccess: async (result) => {
			if (result === 'exists') {
				onError?.(ALREADY_ON_WAITING_LIST);
			} else {
				queryClient.setQueryData<Course | null>(['course', course.slug], (prev) => {
					if (!prev) return prev;
					return {
						...prev,
						waitingListCount: Math.max(0, (prev.waitingListCount ?? 0) + 1),
					};
				});
				void invalidateCourseQueries(queryClient);
			}
			onJoined?.(result);
			await queryClient.invalidateQueries({ queryKey: ['waitingList', uid] });
		},
		onError: (err: unknown) => {
			onError?.(mapWaitlistError(err, WAITLIST_JOIN_ERROR));
		},
	});

	const leave = useMutation({
		mutationFn: async () => {
			if (!uid) throw new Error('Zaloguj się.');
			await removeFromWaitingList(course.id, uid);
		},
		onSuccess: async () => {
			queryClient.setQueryData<Course | null>(['course', course.slug], (prev) => {
				if (!prev) return prev;
				return {
					...prev,
					waitingListCount: Math.max(0, (prev.waitingListCount ?? 0) - 1),
				};
			});
			void invalidateCourseQueries(queryClient);
			onLeft?.();
			await queryClient.invalidateQueries({ queryKey: ['waitingList', uid] });
		},
		onError: (err: unknown) => {
			onError?.(mapWaitlistError(err, WAITLIST_LEAVE_ERROR));
		},
	});

	return {
		user,
		uid,
		isJoined,
		isLoading: waitingQuery.isLoading,
		isPending: join.isPending || leave.isPending,
		join: () => join.mutate(),
		leave: () => leave.mutate(),
		joinAsync: () => join.mutateAsync(),
		leaveAsync: () => leave.mutateAsync(),
	};
};
