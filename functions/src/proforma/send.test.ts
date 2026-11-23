// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../mail', () => ({
	coursePageUrl: (slug: string) => `https://example.test/szkolenia/${slug}`,
	isProformaEmailEnabled: vi.fn(() => true),
	sendMail: vi.fn(),
	CONTACT_EMAIL: 'test@example.com',
	SITE_NAME: 'Test',
	SITE_ORIGIN: 'https://example.test',
	escapeHtml: (s: string) => s,
}));

vi.mock('./pdf', () => ({
	renderProformaPdf: vi.fn(async () => Buffer.from('%PDF-mock')),
}));

vi.mock('./mail', async () => {
	const actual = await vi.importActual<typeof import('./mail')>('./mail');
	return {
		...actual,
		sendProformaMail: vi.fn(),
	};
});

import { isProformaEmailEnabled } from '../mail';
import { sendProformaMail } from './mail';
import { sendEnrollmentProforma } from './send';

const sendProformaMailMock = vi.mocked(sendProformaMail);
const enabledMock = vi.mocked(isProformaEmailEnabled);

type ProformaState = {
	status: string;
	number: string;
	amountNet: number;
	amountGross: number;
	vatRate: number;
	dueDate: string;
	paymentTitle: string;
	sentAt?: string;
	error?: string;
};

const makeDb = (opts: {
	course: Record<string, unknown>;
	user?: Record<string, unknown>;
	billing?: Record<string, unknown> | null;
}) => {
	let courseData = structuredClone(opts.course);
	const updates: ProformaState[] = [];

	const db = {
		collection: (name: string) => {
			if (name === 'courses') {
				return {
					doc: () => ({
						get: async () => ({
							exists: true,
							data: () => courseData,
						}),
					}),
				};
			}
			if (name === 'users') {
				return {
					doc: () => ({
						get: async () => ({
							exists: Boolean(opts.user),
							data: () => opts.user ?? {},
						}),
					}),
				};
			}
			if (name === 'billingData') {
				return {
					where: () => ({
						limit: () => ({
							get: async () => ({
								empty: !opts.billing,
								docs: opts.billing
									? [{ data: () => opts.billing }]
									: [],
							}),
						}),
					}),
				};
			}
			throw new Error(`unexpected collection ${name}`);
		},
		runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
			const ref = {
				/* marker */
			};
			const tx = {
				get: async () => ({
					exists: true,
					data: () => courseData,
				}),
				update: (_ref: unknown, data: { dates: unknown[] }) => {
					courseData = { ...courseData, dates: data.dates };
					const dates = data.dates as Array<{
						participants?: Array<{ proforma?: ProformaState }>;
					}>;
					const p = dates[0]?.participants?.[0]?.proforma;
					if (p) updates.push(structuredClone(p));
				},
			};
			void ref;
			return fn(tx);
		},
	};

	return { db, updates, getCourse: () => courseData };
};

describe('sendEnrollmentProforma', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		enabledMock.mockReturnValue(true);
		sendProformaMailMock.mockResolvedValue({ sent: true });
	});

	const baseCourse = {
		name: 'Movement',
		slug: 'movement',
		price: 500,
		kind: 'course',
		instructor: { id: 'inst1' },
		dates: [
			{
				id: 'd1',
				date: '2026-11-20',
				timeStart: '10:00',
				participants: [
					{
						id: 'u1',
						name: 'Anna',
						email: 'anna@example.com',
					},
				],
			},
		],
	};

	it('sends proforma and marks sent', async () => {
		const { db, updates } = makeDb({
			course: baseCourse,
			user: { nip: '123' },
			billing: null,
		});
		const result = await sendEnrollmentProforma({
			db: db as never,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
		});
		expect(result).toMatchObject({ ok: true, status: 'sent' });
		expect(sendProformaMailMock).toHaveBeenCalledTimes(1);
		expect(updates.some((u) => u.status === 'pending')).toBe(true);
		expect(updates.some((u) => u.status === 'sent')).toBe(true);
	});

	it('marks failed when mail fails; enrollment data intact', async () => {
		sendProformaMailMock.mockResolvedValue({ sent: false, reason: 'smtp_not_configured' });
		const { db, updates, getCourse } = makeDb({
			course: baseCourse,
			billing: null,
		});
		const result = await sendEnrollmentProforma({
			db: db as never,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
		});
		expect(result.ok).toBe(false);
		expect(updates.some((u) => u.status === 'failed')).toBe(true);
		const stillEnrolled = (
			getCourse().dates as Array<{ participants: Array<{ id: string }> }>
		)[0].participants.some((p) => p.id === 'u1');
		expect(stillEnrolled).toBe(true);
	});

	it('skips duplicate when already sent', async () => {
		const course = structuredClone(baseCourse);
		(
			course.dates[0].participants[0] as {
				proforma?: ProformaState;
			}
		).proforma = {
			status: 'sent',
			number: 'PF/EXIST',
			amountNet: 500,
			amountGross: 615,
			vatRate: 23,
			dueDate: '2026-11-15',
			paymentTitle: 'x',
		};
		const { db } = makeDb({ course, billing: null });
		const result = await sendEnrollmentProforma({
			db: db as never,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
		});
		expect(result).toEqual({
			ok: true,
			status: 'skipped',
			reason: 'already_sent',
		});
		expect(sendProformaMailMock).not.toHaveBeenCalled();
	});

	it('skips free enrollments', async () => {
		const course = structuredClone(baseCourse);
		course.price = 0;
		const { db } = makeDb({ course, billing: null });
		const result = await sendEnrollmentProforma({
			db: db as never,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
		});
		expect(result).toEqual({
			ok: true,
			status: 'skipped',
			reason: 'free_or_cash',
		});
		expect(sendProformaMailMock).not.toHaveBeenCalled();
	});

	it('skips when feature flag off', async () => {
		enabledMock.mockReturnValue(false);
		const { db } = makeDb({ course: baseCourse, billing: null });
		const result = await sendEnrollmentProforma({
			db: db as never,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
		});
		expect(result).toEqual({
			ok: true,
			status: 'skipped',
			reason: 'disabled',
		});
	});
});
