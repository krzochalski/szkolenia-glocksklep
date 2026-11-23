// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendUpdatedProformaMail = vi.fn();
const renderProformaPdf = vi.fn(async () => Buffer.from('pdf'));

vi.mock('./mail', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./mail')>();
	return {
		...actual,
		sendUpdatedProformaMail: (...args: unknown[]) => sendUpdatedProformaMail(...args),
	};
});

vi.mock('./pdf', () => ({
	renderProformaPdf: (...args: unknown[]) => renderProformaPdf(...args),
}));

vi.mock('../mail', () => ({
	coursePageUrl: (slug: string) => `https://example.com/szkolenia/${slug}`,
	isProformaEmailEnabled: () => true,
	escapeHtml: (s: string) => s,
	sendMail: vi.fn(),
	SITE_NAME: 'Test',
	SITE_ORIGIN: 'https://example.com',
	CONTACT_EMAIL: 'test@example.com',
}));

import { adjustParticipantPrice } from './adjustPrice';

type Store = {
	courses: Map<string, Record<string, unknown>>;
	priceChanges: Map<string, Record<string, unknown>>;
	users: Map<string, Record<string, unknown>>;
	billing: Array<Record<string, unknown>>;
};

const makeDb = (store: Store) => {
	const courseRef = (courseId: string) => ({
		get: async () => ({
			exists: store.courses.has(courseId),
			data: () => store.courses.get(courseId),
		}),
		collection: (name: string) => {
			if (name !== 'priceChanges') throw new Error(`unexpected ${name}`);
			return {
				doc: (id: string) => ({
					get: async () => ({
						exists: store.priceChanges.has(`${courseId}/${id}`),
						data: () => store.priceChanges.get(`${courseId}/${id}`),
					}),
					set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
						const key = `${courseId}/${id}`;
						const prev = store.priceChanges.get(key) ?? {};
						store.priceChanges.set(
							key,
							opts?.merge ? { ...prev, ...data } : data
						);
					},
				}),
			};
		},
	});

	return {
		collection: (name: string) => {
			if (name === 'courses') {
				return {
					doc: (id: string) => courseRef(id),
				};
			}
			if (name === 'users') {
				return {
					doc: (id: string) => ({
						get: async () => ({
							exists: store.users.has(id),
							data: () => store.users.get(id),
						}),
					}),
				};
			}
			if (name === 'billingData') {
				return {
					where: () => ({
						limit: () => ({
							get: async () => ({
								empty: store.billing.length === 0,
								docs: store.billing.map((d) => ({ data: () => d })),
							}),
						}),
					}),
				};
			}
			throw new Error(`unexpected collection ${name}`);
		},
		runTransaction: async (fn: (tx: {
			get: (ref: { get: () => Promise<unknown> }) => Promise<unknown>;
			update: (ref: unknown, data: { dates: unknown }) => void;
		}) => Promise<void>) => {
			const updates: Array<{ courseId: string; dates: unknown }> = [];
			await fn({
				get: async (ref) => ref.get(),
				update: (_ref, data) => {
					// last course mutated in tests is course1
					updates.push({ courseId: 'course1', dates: data.dates });
					store.courses.set('course1', {
						...store.courses.get('course1')!,
						dates: data.dates,
					});
				},
			});
		},
	};
};

describe('adjustParticipantPrice', () => {
	beforeEach(() => {
		sendUpdatedProformaMail.mockReset();
		sendUpdatedProformaMail.mockResolvedValue({ sent: true });
		renderProformaPdf.mockClear();
	});

	const seed = () => {
		const store: Store = {
			courses: new Map([
				[
					'course1',
					{
						name: 'Metoda Fokusa',
						slug: 'metoda-fokusa',
						price: 850,
						kind: 'course',
						instructor: { id: 'inst1' },
						dates: [
							{
								id: 'date1',
								date: '2026-12-10',
								timeStart: '10:00',
								participants: [
									{
										id: 'user1',
										name: 'Jan Kowalski',
										email: 'jan@example.com',
										proforma: {
											status: 'sent',
											number: 'PF/SZK-MF-JK/12/2026',
											amountNet: 850,
											amountGross: 1045.5,
											vatRate: 23,
											dueDate: '2026-12-05',
											paymentTitle: 't',
											version: 1,
											sentAt: '2026-11-01T10:00:00.000Z',
										},
									},
								],
							},
						],
					},
				],
			]),
			priceChanges: new Map(),
			users: new Map([['user1', { displayName: 'Jan Kowalski' }]]),
			billing: [],
		};
		return store;
	};

	it('creates one updated proforma + one e-mail; retry is idempotent', async () => {
		const store = seed();
		const db = makeDb(store) as never;
		const body = {
			courseId: 'course1',
			dateId: 'date1',
			participantId: 'user1',
			priceChangeId: '11111111-1111-4111-8111-111111111111',
			adjustment: { type: 'finalPrice' as const, value: 700 },
			reason: 'Rabat indywidualny',
		};

		const first = await adjustParticipantPrice({
			db,
			adminUid: 'admin1',
			body,
		});
		expect(first.ok).toBe(true);
		if (first.ok) {
			expect(first.newFinalPrice).toBe(700);
			expect(first.proformaNumber).toContain('/v2');
		}
		expect(sendUpdatedProformaMail).toHaveBeenCalledTimes(1);

		const second = await adjustParticipantPrice({
			db,
			adminUid: 'admin1',
			body,
		});
		expect(second.ok).toBe(true);
		if (second.ok) expect(second.status).toBe('idempotent');
		expect(sendUpdatedProformaMail).toHaveBeenCalledTimes(1);
	});

	it('requires confirm when participant is paid', async () => {
		const store = seed();
		const date = (store.courses.get('course1')!.dates as Array<{ participants: Array<{ paid?: boolean }> }>)[0];
		date.participants[0].paid = true;
		const db = makeDb(store) as never;

		const result = await adjustParticipantPrice({
			db,
			adminUid: 'admin1',
			body: {
				courseId: 'course1',
				dateId: 'date1',
				participantId: 'user1',
				priceChangeId: '22222222-2222-4222-8222-222222222222',
				adjustment: { type: 'fixed', value: 100 },
				reason: 'Rabat',
			},
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe('paid_confirm_required');
		expect(sendUpdatedProformaMail).not.toHaveBeenCalled();
	});

	it('paid + confirm + lower price uses soft e-mail copy', async () => {
		const store = seed();
		const date = (store.courses.get('course1')!.dates as Array<{ participants: Array<{ paid?: boolean }> }>)[0];
		date.participants[0].paid = true;
		const db = makeDb(store) as never;

		const result = await adjustParticipantPrice({
			db,
			adminUid: 'admin1',
			body: {
				courseId: 'course1',
				dateId: 'date1',
				participantId: 'user1',
				priceChangeId: '33333333-3333-4333-8333-333333333333',
				adjustment: { type: 'finalPrice', value: 500 },
				reason: 'Rabat mundurowy',
				confirmPaidAdjustment: true,
			},
		});
		expect(result.ok).toBe(true);
		expect(sendUpdatedProformaMail).toHaveBeenCalledTimes(1);
		const arg = sendUpdatedProformaMail.mock.calls[0][0] as {
			alreadyPaidOverNew: boolean;
		};
		expect(arg.alreadyPaidOverNew).toBe(true);
	});
});
