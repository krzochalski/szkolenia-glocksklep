import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { SITE_ORIGIN } from './mail';

const TOKEN_VERSION = 1;

export const waitlistUnsubscribeBodySchema = z.object({
	token: z.string().min(10),
});

const getSecret = (): string => {
	const explicit = process.env.WAITLIST_UNSUB_SECRET?.trim();
	if (explicit) return explicit;
	const smtp = process.env.SMTP_PASS?.trim();
	if (smtp) return `waitlist-unsub:${smtp}`;
	return 'waitlist-unsub-dev-insecure';
};

const signPayload = (payload: string): string =>
	createHmac('sha256', getSecret()).update(payload).digest('base64url');

type TokenBody = {
	v: number;
	entryId: string;
	courseId: string;
	email: string;
};

/** Build opaque unsubscribe token for waitlist emails. */
export const buildWaitlistUnsubscribeToken = (input: {
	entryId: string;
	email: string;
	courseId: string;
}): string => {
	const body: TokenBody = {
		v: TOKEN_VERSION,
		entryId: input.entryId,
		courseId: input.courseId,
		email: input.email.trim().toLowerCase(),
	};
	const payload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
	const sig = signPayload(payload);
	return `${payload}.${sig}`;
};

export const waitlistUnsubscribeUrl = (token: string): string =>
	`${SITE_ORIGIN}/lista-oczekujacych/wypisz?token=${encodeURIComponent(token)}`;

export type ParsedWaitlistUnsubToken =
	| { ok: true; entryId: string; courseId: string; email: string }
	| { ok: false; reason: string };

export const parseWaitlistUnsubscribeToken = (token: string): ParsedWaitlistUnsubToken => {
	try {
		const dot = token.lastIndexOf('.');
		if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: 'invalid_format' };
		const payload = token.slice(0, dot);
		const sig = token.slice(dot + 1);
		const expected = signPayload(payload);
		const a = Buffer.from(sig);
		const b = Buffer.from(expected);
		if (a.length !== b.length || !timingSafeEqual(a, b)) {
			return { ok: false, reason: 'bad_signature' };
		}
		const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenBody;
		if (
			body.v !== TOKEN_VERSION ||
			typeof body.entryId !== 'string' ||
			typeof body.courseId !== 'string' ||
			typeof body.email !== 'string'
		) {
			return { ok: false, reason: 'invalid_parts' };
		}
		return {
			ok: true,
			entryId: body.entryId,
			courseId: body.courseId,
			email: body.email.trim().toLowerCase(),
		};
	} catch {
		return { ok: false, reason: 'parse_error' };
	}
};

export const unsubscribeWaitlistByToken = async (
	db: Firestore,
	token: string
): Promise<{ ok: true; removed: boolean } | { ok: false; error: string }> => {
	const parsed = parseWaitlistUnsubscribeToken(token);
	if (!parsed.ok) {
		return { ok: false, error: 'Nieprawidłowy lub wygasły link wypisania.' };
	}
	const ref = db.collection('courseWaitingList').doc(parsed.entryId);
	const snap = await ref.get();
	if (!snap.exists) {
		return { ok: true, removed: false };
	}
	const data = snap.data() as { email?: string; courseId?: string };
	const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
	const courseId = typeof data.courseId === 'string' ? data.courseId : '';
	if (email !== parsed.email || courseId !== parsed.courseId) {
		return { ok: false, error: 'Nieprawidłowy link wypisania.' };
	}
	await ref.delete();
	return { ok: true, removed: true };
};
