import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

import {
	CONTACT_EMAIL,
	coursePageUrl,
	escapeHtml,
	sendMail,
	SITE_NAME,
	SITE_ORIGIN,
} from './mail';

export const WAITLIST_NOTIFY_MAX_RECIPIENTS = 200;

export const waitlistNotifyBodySchema = z
	.object({
		scope: z.enum(['course', 'all']),
		courseId: z.string().min(1).optional(),
		subject: z.string().trim().min(1).max(200),
		body: z.string().trim().min(1).max(10_000),
	})
	.superRefine((val, ctx) => {
		if (val.scope === 'course' && !val.courseId) {
			ctx.addIssue({
				code: 'custom',
				message: 'courseId required for course scope',
				path: ['courseId'],
			});
		}
	});

export type WaitlistNotifyBody = z.infer<typeof waitlistNotifyBodySchema>;

type WaitingListDoc = {
	courseId?: string;
	courseName?: string;
	courseSlug?: string;
	userName?: string;
	email?: string;
};

export type WaitlistNotifyVars = {
	participantName: string;
	imie: string;
	courseName: string;
	courseUrl: string;
};

export const applyWaitlistNotifyPlaceholders = (
	template: string,
	vars: WaitlistNotifyVars
): string =>
	template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
		key in vars ? vars[key as keyof WaitlistNotifyVars] : `{{${key}}}`
	);

export const isValidEmailAddress = (email: string): boolean =>
	z.string().email().safeParse(email).success;

const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

const bodyToHtmlParagraphs = (body: string): string =>
	escapeHtml(body)
		.split(/\n{2,}/)
		.map((block) => {
			const lines = block.split('\n').join('<br />');
			return `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">${lines}</p>`;
		})
		.join('');

export const buildWaitlistNotifyHtml = (subject: string, body: string): string => {
	const site = escapeHtml(SITE_NAME);
	const contact = escapeHtml(CONTACT_EMAIL);
	const title = escapeHtml(subject);
	return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${muted};color:${ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${muted};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${paper};border:3px solid ${border};">
          <tr>
            <td style="padding:20px 24px;border-bottom:3px solid ${border};background:${ink};">
              <p style="margin:0;font-family:'Space Mono',Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">${site}</p>
              <h1 style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;color:${paper};text-transform:uppercase;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${bodyToHtmlParagraphs(body)}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;border-top:3px solid ${border};background:${muted};">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${secondary};">
                ${site} ·
                <a href="mailto:${contact}" style="color:${accent};text-decoration:none;">${contact}</a>
                · <a href="${escapeHtml(SITE_ORIGIN)}" style="color:${accent};text-decoration:none;">${escapeHtml(SITE_ORIGIN.replace(/^https?:\/\//, ''))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export type WaitlistNotifyResult = {
	ok: true;
	sent: number;
	skipped: number;
	failed: number;
	recipientCount: number;
	skippedInvalid: number;
	courseIds: string[];
};

export const sendWaitlistNotify = async (
	db: Firestore,
	input: WaitlistNotifyBody
): Promise<WaitlistNotifyResult | { ok: false; error: string; code: string }> => {
	const col = db.collection('courseWaitingList');
	const snap =
		input.scope === 'course' && input.courseId
			? await col.where('courseId', '==', input.courseId).get()
			: await col.get();

	const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as WaitingListDoc) }));
	if (docs.length === 0) {
		return { ok: false, error: 'Brak wpisów na liście oczekujących.', code: 'empty' };
	}
	if (docs.length > WAITLIST_NOTIFY_MAX_RECIPIENTS) {
		return {
			ok: false,
			error: `Za dużo odbiorców (${docs.length}). Limit: ${WAITLIST_NOTIFY_MAX_RECIPIENTS}.`,
			code: 'too_many',
		};
	}

	let sent = 0;
	let skipped = 0;
	let failed = 0;
	let skippedInvalid = 0;
	const courseIds = new Set<string>();

	for (const entry of docs) {
		const email = (entry.email ?? '').trim().toLowerCase();
		const courseId = entry.courseId?.trim() ?? '';
		const courseName = entry.courseName?.trim() || 'Szkolenie';
		const courseSlug = entry.courseSlug?.trim() || '';
		const participantName = entry.userName?.trim() || 'Gość';

		if (courseId) courseIds.add(courseId);

		if (!email || !isValidEmailAddress(email)) {
			skipped += 1;
			skippedInvalid += 1;
			continue;
		}

		const vars: WaitlistNotifyVars = {
			participantName,
			imie: participantName,
			courseName,
			courseUrl: courseSlug ? coursePageUrl(courseSlug) : SITE_ORIGIN,
		};
		const subject = applyWaitlistNotifyPlaceholders(input.subject, vars);
		const textBody = applyWaitlistNotifyPlaceholders(input.body, vars);
		const html = buildWaitlistNotifyHtml(subject, textBody);

		try {
			const result = await sendMail({
				to: email,
				subject,
				html,
				text: textBody,
			});
			if (result.sent) {
				sent += 1;
			} else {
				failed += 1;
				console.warn('Waitlist notify skip/fail', result.reason, email);
			}
		} catch (err) {
			failed += 1;
			console.error('Waitlist notify email failed', email, err);
		}
	}

	const now = new Date().toISOString();
	await Promise.all(
		[...courseIds].map((id) =>
			db
				.doc(`courses/${id}`)
				.set({ waitingListLastEmailedAt: now }, { merge: true })
				.catch((err) => {
					console.error('Failed to set waitingListLastEmailedAt', id, err);
				})
		)
	);

	return {
		ok: true,
		sent,
		skipped,
		failed,
		recipientCount: docs.length,
		skippedInvalid,
		courseIds: [...courseIds],
	};
};
