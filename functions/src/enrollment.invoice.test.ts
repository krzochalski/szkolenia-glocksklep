import { describe, expect, it, vi } from 'vitest';
import { enrollInCourseTx } from './enrollment';

type DocSnap = {
	exists: boolean;
	data: () => Record<string, unknown> | undefined;
};

const makeDb = (course: Record<string, unknown>) => {
	const courseSnap: DocSnap = { exists: true, data: () => course };
	const update = vi.fn();
	const tx = {
		get: vi.fn(async (ref: { path: string }) => {
			if (ref.path.startsWith('courses/')) return courseSnap;
			return { exists: false, data: () => undefined };
		}),
		update,
	};
	const db = {
		collection: (name: string) => {
			if (name === 'courses') return { doc: () => ({ path: 'courses/c1' }) };
			return {
				doc: (id: string) => ({
					path: `${name}/${id}`,
					get: async () => ({ exists: false }),
					delete: vi.fn(),
				}),
			};
		},
		runTransaction: async (fn: (t: typeof tx) => Promise<void>) => fn(tx),
	};
	return { db: db as never, update };
};

const baseCourse = {
	dates: [
		{
			id: 'd1',
			date: '2099-06-15',
			timeStart: '10:00',
			slotsMax: 10,
			participants: [],
		},
	],
};

describe('enrollInCourseTx — invoice fields', () => {
	it('sets documentType receipt without NIP', async () => {
		const { db, update } = makeDb(baseCourse);
		await enrollInCourseTx(db, 'u1', {
			courseId: 'c1',
			dateId: 'd1',
			participant: {
				id: 'u1',
				name: 'Ada',
				email: 'a@example.com',
			},
		});
		const payload = update.mock.calls[0][1] as { dates: Array<{ participants: unknown[] }> };
		const p = payload.dates[0].participants[0] as Record<string, unknown>;
		expect(p.documentType).toBe('receipt');
		expect(p.invoiceNip).toBeUndefined();
	});

	it('stores invoice data and documentType invoice when NIP valid', async () => {
		const { db, update } = makeDb(baseCourse);
		await enrollInCourseTx(db, 'u1', {
			courseId: 'c1',
			dateId: 'd1',
			participant: {
				id: 'u1',
				name: 'Ada',
				email: 'a@example.com',
				invoiceNip: '8291724148',
				invoiceCompanyName: 'ACME Sp. z o.o.',
				invoiceCompanyAddress: 'ul. Testowa 1, Warszawa',
			},
		});
		const payload = update.mock.calls[0][1] as { dates: Array<{ participants: unknown[] }> };
		const p = payload.dates[0].participants[0] as Record<string, unknown>;
		expect(p.documentType).toBe('invoice');
		expect(p.invoiceNip).toBe('8291724148');
		expect(p.invoiceCompanyName).toBe('ACME Sp. z o.o.');
	});
});