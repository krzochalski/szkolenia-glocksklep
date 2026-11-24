import { describe, expect, it } from 'vitest';
import { issueSalesDocumentAfterPayment } from './issueSalesDocument';

describe('issueSalesDocumentAfterPayment', () => {
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

	it('documents SZ-18 hook for receipt', async () => {
		const result = await issueSalesDocumentAfterPayment({
			db: {} as never,
			courseId: 'c1',
			dateId: 'd1',
			participantId: 'u1',
			documentType: 'receipt',
			paid: true,
		});
		expect(result).toEqual({ status: 'skipped', reason: 'receipt_sz_18' });
	});
});