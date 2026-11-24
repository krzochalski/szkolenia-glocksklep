import type { Firestore } from 'firebase-admin/firestore';

import { CONTACT_EMAIL, sendMail, SITE_NAME } from '../mail';
import type { FakturowniaReceiptRef } from './fakturownia';

const escapeHtml = (s: string): string =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

export const sendParticipantReceiptMail = async (input: {
	to: string;
	courseName: string;
	classDateYmd: string;
	receipt: FakturowniaReceiptRef;
}): Promise<{ sent: boolean; reason?: string }> => {
	const link = input.receipt.viewUrl?.trim();
	if (!link) {
		return { sent: false, reason: 'missing_view_url' };
	}
	const numberPart = input.receipt.number?.trim()
		? ` (${input.receipt.number})`
		: '';
	const subject = `Paragon za szkolenie${numberPart} — ${SITE_NAME}`;
	const plain = [
		`Dziękujemy za opłacenie zapisu na szkolenie.`,
		``,
		`Kurs: ${input.courseName}`,
		`Termin: ${input.classDateYmd}`,
		`Paragon${numberPart}: ${link}`,
		``,
		`W razie pytań: ${CONTACT_EMAIL}`,
	].join('\n');
	const html = `
<p>Dziękujemy za opłacenie zapisu na szkolenie.</p>
<p><strong>${escapeHtml(input.courseName)}</strong><br/>Termin: ${escapeHtml(input.classDateYmd)}</p>
<p><a href="${escapeHtml(link)}">Otwórz paragon${escapeHtml(numberPart)}</a></p>
<p>W razie pytań: <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a></p>`;
	return sendMail({ to: input.to, subject, html, text: plain });
};

type CourseDate = {
	id?: string;
	date?: string;
	participants?: Array<Record<string, unknown>>;
};

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

/** Record receipt e-mail attempt on the participant (Admin SDK). */
export const updateParticipantReceiptEmail = async (
	db: Firestore,
	params: {
		courseId: string;
		dateId: string;
		participantId: string;
		sent: boolean;
		error?: string;
	}
): Promise<void> => {
	const ref = db.collection('courses').doc(params.courseId);
	const receiptEmail = params.sent
		? { sentAt: new Date().toISOString() }
		: { error: params.error ?? 'smtp_failed' };
	await db.runTransaction(async (tx) => {
		const snap = await tx.get(ref);
		if (!snap.exists) return;
		const course = snap.data() as { dates?: CourseDate[] };
		const dates = (course.dates ?? []).map((d) => {
			if (!matchDate(d, params.dateId)) return d;
			const participants = (d.participants ?? []).map((p) =>
				p.id === params.participantId ? { ...p, receiptEmail } : p
			);
			return { ...d, participants };
		});
		tx.update(ref, { dates });
	});
};