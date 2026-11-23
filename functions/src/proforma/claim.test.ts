// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { decideProformaClaim, type ParticipantProformaState } from './claim';

const base = (over: Partial<ParticipantProformaState> = {}): ParticipantProformaState => ({
	status: 'pending',
	number: 'PF/1',
	amountNet: 100,
	amountGross: 123,
	vatRate: 23,
	dueDate: '2026-11-15',
	paymentTitle: 'PF/1 · test',
	...over,
});

describe('decideProformaClaim', () => {
	it('skips when already sent (no force)', () => {
		const r = decideProformaClaim({
			existing: base({ status: 'sent' }),
			forceResend: false,
			nextState: base(),
		});
		expect(r).toEqual({ action: 'skip', reason: 'already_sent' });
	});

	it('skips when already pending (no force)', () => {
		const r = decideProformaClaim({
			existing: base({ status: 'pending' }),
			forceResend: false,
			nextState: base(),
		});
		expect(r).toEqual({ action: 'skip', reason: 'already_pending' });
	});

	it('creates pending when missing', () => {
		const r = decideProformaClaim({
			existing: null,
			forceResend: false,
			nextState: base({ number: 'PF/NEW' }),
		});
		expect(r.action).toBe('create');
		if (r.action === 'create') {
			expect(r.state.status).toBe('pending');
			expect(r.state.number).toBe('PF/NEW');
		}
	});

	it('creates again after failed', () => {
		const r = decideProformaClaim({
			existing: base({ status: 'failed', number: 'PF/OLD', error: 'smtp' }),
			forceResend: false,
			nextState: base({ number: 'PF/NEW' }),
		});
		expect(r.action).toBe('create');
	});

	it('resends existing sent snapshot when forceResend', () => {
		const existing = base({ status: 'sent', number: 'PF/KEEP' });
		const r = decideProformaClaim({
			existing,
			forceResend: true,
			nextState: base({ number: 'PF/NEW' }),
		});
		expect(r).toEqual({ action: 'resend', state: existing });
	});

	it('reuses failed number on forceResend create', () => {
		const r = decideProformaClaim({
			existing: base({ status: 'failed', number: 'PF/KEEP' }),
			forceResend: true,
			nextState: base({ number: 'PF/NEW' }),
		});
		expect(r.action).toBe('create');
		if (r.action === 'create') {
			expect(r.state.number).toBe('PF/KEEP');
			expect(r.state.status).toBe('pending');
		}
	});
});
