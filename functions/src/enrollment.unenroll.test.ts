import { describe, expect, it, vi } from 'vitest';
import {
	CANCELLATION_DEADLINE_HOURS_BEFORE,
	cancellationDeadlineUtc,
	unenrollBlockedMessage,
} from './cancellationDeadline';
import { unenrollFromCourseTx } from './enrollment';

type DocSnap = {
	exists: boolean;
	data: () => Record<string, unknown> | undefined;
};

const makeDb = (opts: {
	course: Record<string, unknown>;
	completionExists?: boolean;
}) => {
	const courseSnap: DocSnap = {
		exists: true,
		data: () => opts.course,
	};
	const completionSnap: DocSnap = {
		exists: Boolean(opts.completionExists),
		data: () => (opts.completionExists ? { courseId: 'c1' } : undefined),
	};

	const update = vi.fn();
	const tx = {
		get: vi.fn(async (ref: { path: string }) => {
			if (ref.path.startsWith('courses/')) return courseSnap;
			if (ref.path.includes('courseCompletions')) return completionSnap;
			return { exists: false, data: () => undefined };
		}),
		update,
	};

	const completionDoc = {
		path: `users/u1/courseCompletions/c1`,
	};
	const courseDoc = {
		path: 'courses/c1',
	};

	const db = {
		collection: (name: string) => {
			if (name === 'courses') {
				return {
					doc: () => courseDoc,
				};
			}
			if (name === 'users') {
				return {
					doc: () => ({
						collection: (sub: string) => ({
							doc: () => {
								if (sub === 'courseCompletions') return completionDoc;
								return { path: `users/u1/${sub}/x` };
							},
						}),
					}),
				};
			}
			return { doc: () => ({ path: `${name}/x` }) };
		},
		runTransaction: async (fn: (t: typeof tx) => Promise<void>) => fn(tx),
	};

	return { db: db as never, update, tx };
};

const farFutureCourse = {
	dates: [
		{
			id: 'd1',
			date: '2099-06-15',
			timeStart: '10:00',
			participants: [{ id: 'u1', name: 'Ada', email: 'a@example.com' }],
		},
	],
};

describe('unenrollFromCourseTx deadline gate', () => {
	it('rejects self-unenroll at or after the 96h deadline', async () => {
		const date = '2025-01-15';
		const timeStart = '10:00';
		const deadline = cancellationDeadlineUtc(date, timeStart);
		const { db, update } = makeDb({
			course: {
				dates: [
					{
						id: 'd1',
						date,
						timeStart,
						participants: [{ id: 'u1', name: 'Ada', email: 'a@example.com' }],
					},
				],
			},
		});

		await expect(
			unenrollFromCourseTx(
				db,
				'u1',
				{ courseId: 'c1', dateId: 'd1', participantId: 'u1' },
				false,
				deadline
			)
		).rejects.toThrow(unenrollBlockedMessage('deadline_passed'));
		expect(update).not.toHaveBeenCalled();
		expect(CANCELLATION_DEADLINE_HOURS_BEFORE).toBe(96);
	});

	it('rejects self-unenroll when attendance is marked', async () => {
		const { db, update } = makeDb({
			course: farFutureCourse,
			completionExists: true,
		});

		await expect(
			unenrollFromCourseTx(
				db,
				'u1',
				{ courseId: 'c1', dateId: 'd1', participantId: 'u1' },
				false,
				new Date('2025-01-01T00:00:00.000Z')
			)
		).rejects.toThrow(unenrollBlockedMessage('course_taken_place'));
		expect(update).not.toHaveBeenCalled();
	});

	it('allows admin unenroll after the deadline', async () => {
		const date = '2025-01-15';
		const timeStart = '10:00';
		const deadline = cancellationDeadlineUtc(date, timeStart);
		const { db, update } = makeDb({
			course: {
				dates: [
					{
						id: 'd1',
						date,
						timeStart,
						participants: [{ id: 'u1', name: 'Ada', email: 'a@example.com' }],
					},
				],
			},
		});

		await unenrollFromCourseTx(
			db,
			'admin1',
			{ courseId: 'c1', dateId: 'd1', participantId: 'u1' },
			true,
			deadline
		);
		expect(update).toHaveBeenCalledTimes(1);
	});

	it('allows self-unenroll more than 96h before start', async () => {
		const date = '2025-01-15';
		const timeStart = '10:00';
		const deadline = cancellationDeadlineUtc(date, timeStart);
		const now = new Date(deadline.getTime() - 60_000);
		const { db, update } = makeDb({
			course: {
				dates: [
					{
						id: 'd1',
						date,
						timeStart,
						participants: [{ id: 'u1', name: 'Ada', email: 'a@example.com' }],
					},
				],
			},
		});

		await unenrollFromCourseTx(
			db,
			'u1',
			{ courseId: 'c1', dateId: 'd1', participantId: 'u1' },
			false,
			now
		);
		expect(update).toHaveBeenCalledTimes(1);
	});
});
