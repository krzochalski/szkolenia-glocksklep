import { describe, expect, it, vi } from 'vitest';

import {
	AdminAuthError,
	buildReceiptViewUrl,
	buildRegistrationReceiptPayload,
	parseStoredReceipt,
	requireAdmin,
	warsawDateString,
} from './fakturownia';
import { FALLBACK_BILLING } from '../proforma/build';
import { registrationReceiptOid } from './receiptPositions';

describe('buildRegistrationReceiptPayload', () => {
	it('maps seller, buyer and oid with training prefix', () => {
		const payload = buildRegistrationReceiptPayload({
			oid: 'SZ/SZK-MF-PK/03/2026',
			buyerName: 'Jan Kowalski',
			buyerEmail: 'jan@example.com',
			seller: FALLBACK_BILLING,
			serviceLine: 'Szkolenie strzeleckie: Test (2026-03-01)',
			amountNet: 400,
			issueDate: '2026-03-01',
		});
		expect(payload.kind).toBe('receipt');
		expect(payload.oid).toBe('SZ/SZK-MF-PK/03/2026');
		expect(payload.positions).toHaveLength(1);
		expect(payload.positions[0]?.tax).toBe(23);
		expect(payload.positions[0]?.total_price_gross).toBe(492);
	});
});

describe('registrationReceiptOid', () => {
	it('replaces PF with SZ', () => {
		expect(registrationReceiptOid('PF/SZK-ABC/03/2026', 'fb')).toBe('SZ/SZK-ABC/03/2026');
	});
});

describe('buildReceiptViewUrl', () => {
	it('builds public invoice URL from token', () => {
		expect(buildReceiptViewUrl('acme', 'TokEn123')).toBe(
			'https://acme.fakturownia.pl/invoice/TokEn123'
		);
	});
});

describe('parseStoredReceipt', () => {
	it('ignores issuing lock', () => {
		expect(
			parseStoredReceipt({ status: 'issuing', issuingAt: new Date().toISOString() })
		).toBeNull();
	});

	it('parses completed receipt', () => {
		expect(
			parseStoredReceipt({
				receiptId: 12,
				number: 'P/1',
				viewUrl: 'https://x',
				createdAt: '2026-01-01',
			})
		).toMatchObject({ receiptId: 12, number: 'P/1' });
	});
});

describe('warsawDateString', () => {
	it('formats as YYYY-MM-DD', () => {
		expect(warsawDateString(new Date('2026-10-26T12:00:00+02:00'))).toMatch(
			/^\d{4}-\d{2}-\d{2}$/
		);
	});
});

describe('requireAdmin', () => {
	const auth = {
		verifyIdToken: vi.fn(async (token: string) => {
			if (token === 'google-id-token') {
				throw new Error('wrong audience');
			}
			if (token !== 'firebase-id-token') {
				throw new Error('bad token');
			}
			return { uid: 'admin-1', email: 'a@example.com' };
		}),
	};
	const db = {
		doc: (path: string) => ({
			get: async () => ({ exists: path === 'admins/admin-1' }),
		}),
	};

	it('prefers X-Firebase-Authorization over Google Authorization (proxy)', async () => {
		const admin = await requireAdmin(
			{
				headers: {
					authorization: 'Bearer google-id-token',
					'x-firebase-authorization': 'Bearer firebase-id-token',
				},
			},
			auth as never,
			db as never
		);
		expect(admin).toEqual({ uid: 'admin-1', email: 'a@example.com' });
		expect(auth.verifyIdToken).toHaveBeenCalledWith('firebase-id-token');
	});

	it('rejects Google ID token when Firebase header missing', async () => {
		await expect(
			requireAdmin(
				{ headers: { authorization: 'Bearer google-id-token' } },
				auth as never,
				db as never
			)
		).rejects.toBeInstanceOf(AdminAuthError);
	});
});