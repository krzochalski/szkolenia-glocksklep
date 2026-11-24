import { describe, expect, it, vi, beforeEach } from 'vitest';

const { createReceiptForRegistration, sendParticipantReceiptMail, updateParticipantReceiptEmail } =
	vi.hoisted(() => ({
		createReceiptForRegistration: vi.fn(),
		sendParticipantReceiptMail: vi.fn(),
		updateParticipantReceiptEmail: vi.fn(),
	}));

vi.mock('./fakturownia', () => ({
	createReceiptForRegistration,
	FakturowniaApiError: class extends Error {
		status = 400;
	},
	FakturowniaConfigError: class extends Error {
		status = 503;
	},
}));

vi.mock('./receiptMail', () => ({
	sendParticipantReceiptMail,
	updateParticipantReceiptEmail,
}));

import { issueSalesDocumentAfterPayment } from './issueSalesDocument';

describe('issueSalesDocumentAfterPayment', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('skips when not paid', async () => {
		const result = await issueSalesDocumentAfterPayment({
			db: {} as never,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
			documentType: 'receipt',
			paid: false,
		});
		expect(result).toEqual({ status: 'skipped', reason: 'not_paid' });
	});

	it('issues Fakturownia receipt when paid', async () => {
		createReceiptForRegistration.mockResolvedValue({
			alreadyExists: false,
			receipt: {
				receiptId: 1,
				number: 'P1',
				viewUrl: 'https://x.fakturownia.pl/invoice/t',
				createdAt: '2026-01-01',
			},
		});
		const get = vi.fn().mockResolvedValue({
			exists: true,
			data: () => ({
				name: 'Kurs',
				dates: [
					{
						id: 'd1',
						date: '2026-03-01',
						participants: [{ id: 'u1', email: 'a@b.pl' }],
					},
				],
			}),
		});
		sendParticipantReceiptMail.mockResolvedValue({ sent: true });
		const db = {
			collection: () => ({ doc: () => ({ get }) }),
		} as never;

		const result = await issueSalesDocumentAfterPayment({
			db,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
			documentType: 'receipt',
			paid: true,
		});

		expect(createReceiptForRegistration).toHaveBeenCalled();
		expect(sendParticipantReceiptMail).toHaveBeenCalled();
		expect(result.status).toBe('issued');
	});
});