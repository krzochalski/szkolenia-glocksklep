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
import {
	buildWaitlistUnsubscribeToken,
	waitlistUnsubscribeUrl,
} from './waitlistUnsubscribe';

export const WAITLIST_TERM_NOTIFY_MAX = 200;

export const waitlistTermNotifyBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	force: z.boolean().optional(),
});

type CourseDateDoc = {
	id?: string;
	date?: string;
	timeStart?: string;
	slotsMax?: number;
	participants?: unknown[];
	canceled?: boolean;
	subtitle?: string;
	customPrice?: number;
	minDecisionBy?: string;
	waitlistNotifiedAt?: string;
	place?: { name?: string; googleMapsLink?: string; link?: string };
	instructor?: { name?: string };
};

type CourseDoc = {
	name?: string;
	slug?: string;
	price?: number;
	inactive?: boolean;
	dates?: CourseDateDoc[];
};

type WaitingListDoc = {
	email?: string;
	userName?: string;
	courseId?: string;
	courseName?: string;
	courseSlug?: string;
	lastNotifiedTermId?: string;
	guest?: boolean;
};

const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

const isFutureYmd = (dateStr: string, todayYmd: string): boolean => dateStr >= todayYmd;

export const warsawTodayYmd = (now: Date = new Date()): string => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Warsaw',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(now);
	const y = parts.find((p) => p.type === 'year')?.value;
	const m = parts.find((p) => p.type === 'month')?.value;
	const d = parts.find((p) => p.type === 'day')?.value;
	return `${y}-${m}-${d}`;
};

/** Detect terms that should trigger waitlist auto-notify. */
export const findWaitlistNotifyCandidates = (input: {
	beforeDates: CourseDateDoc[];
	afterDates: CourseDateDoc[];
	inactive?: boolean;
	todayYmd: string;
	forceDateId?: string;
}): CourseDateDoc[] => {
	if (input.inactive) return [];
	const beforeById = new Map(
		input.beforeDates.filter((d) => typeof d.id === 'string').map((d) => [d.id as string, d])
	);
	const out: CourseDateDoc[] = [];
	for (const after of input.afterDates) {
		const id = typeof after.id === 'string' ? after.id : '';
		if (!id) continue;
		const dateStr = typeof after.date === 'string' ? after.date : '';
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
		if (after.canceled === true) continue;
		if (!isFutureYmd(dateStr, input.todayYmd)) continue;

		if (input.forceDateId) {
			if (id === input.forceDateId) out.push(after);
			continue;
		}

		if (after.waitlistNotifiedAt) continue;
		const before = beforeById.get(id);
		const isNew = !before;
		const becameOpen = Boolean(before && before.canceled === true);
		if (isNew || becameOpen) out.push(after);
	}
	return out;
};

export type WaitlistTermEmailPayload = {
	subject: string;
	html: string;
	text: string;
};

export const buildWaitlistTermEmailPayload = (input: {
	courseName: string;
	courseSlug: string;
	date: string;
	timeStart: string;
	placeName: string;
	priceLabel: string;
	freeSeats: number;
	slotsMax: number;
	registrationDeadline?: string;
	termId: string;
	unsubscribeUrl: string;
	recipientName: string;
}): WaitlistTermEmailPayload => {
	const enrollUrl = `${coursePageUrl(input.courseSlug)}?termin=${encodeURIComponent(input.termId)}`;
	const name = escapeHtml(input.courseName);
	const subject = `Nowy termin: ${input.courseName} — ${input.date}`;
	const deadlineRow = input.registrationDeadline
		? `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};"><strong>Termin decyzji / zapisów:</strong> ${escapeHtml(input.registrationDeadline)}</p>`
		: '';
	const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${muted};color:${ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${muted};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${paper};border:3px solid ${border};">
          <tr>
            <td style="padding:20px 24px;border-bottom:3px solid ${border};background:${ink};">
              <p style="margin:0;font-family:'Space Mono',Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">${escapeHtml(SITE_NAME)}</p>
              <h1 style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;color:${paper};text-transform:uppercase;">
                Nowy termin szkolenia
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                Cześć${input.recipientName ? ` ${escapeHtml(input.recipientName)}` : ''},
              </p>
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                Pojawił się nowy termin szkolenia <strong>${name}</strong>, na którego listę oczekujących jesteś zapisany/a.
              </p>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};"><strong>Data i godzina:</strong> ${escapeHtml(input.date)} ${escapeHtml(input.timeStart)}</p>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};"><strong>Miejsce:</strong> ${escapeHtml(input.placeName)}</p>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};"><strong>Cena:</strong> ${escapeHtml(input.priceLabel)}</p>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};"><strong>Wolne miejsca:</strong> ${input.freeSeats} / ${input.slotsMax}</p>
              ${deadlineRow}
              <p style="margin:18px 0 16px;">
                <a href="${escapeHtml(enrollUrl)}" style="display:inline-block;padding:12px 18px;background:${accent};color:${paper};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;text-transform:uppercase;">Zapisz się</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${secondary};">
                Pozostajesz na liście oczekujących, dopóki nie zapiszesz się na termin albo nie wypiszesz się z listy.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;border-top:3px solid ${border};background:${muted};">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${secondary};">
                <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${accent};text-decoration:none;">Wypisz się z listy oczekujących</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${secondary};">
                ${escapeHtml(SITE_NAME)} ·
                <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color:${accent};text-decoration:none;">${escapeHtml(CONTACT_EMAIL)}</a>
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

	const text = [
		SITE_NAME.toUpperCase(),
		`Nowy termin: ${input.courseName}`,
		'',
		`Data i godzina: ${input.date} ${input.timeStart}`,
		`Miejsce: ${input.placeName}`,
		`Cena: ${input.priceLabel}`,
		`Wolne miejsca: ${input.freeSeats} / ${input.slotsMax}`,
		input.registrationDeadline
			? `Termin decyzji / zapisów: ${input.registrationDeadline}`
			: '',
		'',
		`Zapisz się: ${enrollUrl}`,
		'',
		`Wypisz się z listy: ${input.unsubscribeUrl}`,
		'',
		`Kontakt: ${CONTACT_EMAIL}`,
	]
		.filter(Boolean)
		.join('\n');

	return { subject, html, text };
};

const formatPriceLabel = (course: CourseDoc, date: CourseDateDoc): string => {
	const price =
		typeof date.customPrice === 'number' && date.customPrice > 0
			? date.customPrice
			: typeof course.price === 'number'
				? course.price
				: 0;
	if (price <= 0) return 'bezpłatne / do ustalenia';
	return `${price.toFixed(2)} PLN netto`;
};

export type WaitlistTermNotifyResult = {
	ok: true;
	sent: number;
	skipped: number;
	failed: number;
	recipientCount: number;
};

/**
 * Notify waitlisted users about one open term. Idempotent unless force=true.
 * Entries stay subscribed; only lastNotifiedTermId / waitlistNotifiedAt are updated.
 */
export const notifyWaitlistForTerm = async (
	db: Firestore,
	input: {
		courseId: string;
		dateId: string;
		force?: boolean;
		todayYmd?: string;
	}
): Promise<WaitlistTermNotifyResult | { ok: false; error: string; code: string }> => {
	const courseRef = db.collection('courses').doc(input.courseId);
	const courseSnap = await courseRef.get();
	if (!courseSnap.exists) {
		return { ok: false, error: 'Kurs nie istnieje.', code: 'not_found' };
	}
	const course = courseSnap.data() as CourseDoc;
	if (course.inactive === true && !input.force) {
		return { ok: false, error: 'Kurs jest nieaktywny.', code: 'inactive' };
	}
	const dates = Array.isArray(course.dates) ? [...course.dates] : [];
	const idx = dates.findIndex((d) => d.id === input.dateId);
	if (idx < 0) {
		return { ok: false, error: 'Termin nie istnieje.', code: 'date_not_found' };
	}
	const term = dates[idx];
	const today = input.todayYmd ?? warsawTodayYmd();
	const dateStr = typeof term.date === 'string' ? term.date : '';
	if (term.canceled === true || !isFutureYmd(dateStr, today)) {
		return { ok: false, error: 'Termin nie jest otwarty (przyszły i nieanulowany).', code: 'not_open' };
	}
	if (!input.force && term.waitlistNotifiedAt) {
		return {
			ok: true,
			sent: 0,
			skipped: 0,
			failed: 0,
			recipientCount: 0,
		};
	}

	const wlSnap = await db
		.collection('courseWaitingList')
		.where('courseId', '==', input.courseId)
		.get();
	if (wlSnap.size > WAITLIST_TERM_NOTIFY_MAX) {
		return {
			ok: false,
			error: `Za dużo osób na liście (max ${WAITLIST_TERM_NOTIFY_MAX}).`,
			code: 'too_many',
		};
	}

	const courseName = course.name || 'Szkolenie';
	const courseSlug = course.slug || '';
	const slotsMax = typeof term.slotsMax === 'number' ? term.slotsMax : 0;
	const taken = Array.isArray(term.participants) ? term.participants.length : 0;
	const freeSeats = Math.max(0, slotsMax - taken);
	const placeName = term.place?.name?.trim() || 'do potwierdzenia';
	const priceLabel = formatPriceLabel(course, term);
	const timeStart = term.timeStart || '';
	const registrationDeadline = term.minDecisionBy?.trim() || undefined;

	let sent = 0;
	let skipped = 0;
	let failed = 0;

	for (const docSnap of wlSnap.docs) {
		const data = docSnap.data() as WaitingListDoc;
		const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
		if (!email || !email.includes('@')) {
			skipped += 1;
			continue;
		}
		if (!input.force && data.lastNotifiedTermId === input.dateId) {
			skipped += 1;
			continue;
		}
		const unsubToken = buildWaitlistUnsubscribeToken({
			entryId: docSnap.id,
			email,
			courseId: input.courseId,
		});
		const payload = buildWaitlistTermEmailPayload({
			courseName,
			courseSlug,
			date: dateStr,
			timeStart,
			placeName,
			priceLabel,
			freeSeats,
			slotsMax,
			registrationDeadline,
			termId: input.dateId,
			unsubscribeUrl: waitlistUnsubscribeUrl(unsubToken),
			recipientName: data.userName === 'Gość' ? '' : (data.userName || ''),
		});
		try {
			const result = await sendMail({
				to: email,
				subject: payload.subject,
				html: payload.html,
				text: payload.text,
			});
			if (!result.sent) {
				failed += 1;
				console.error('Waitlist term notify skipped (smtp)', email, result.reason);
				continue;
			}
			await docSnap.ref.update({ lastNotifiedTermId: input.dateId });
			sent += 1;
		} catch (err) {
			failed += 1;
			console.error('Waitlist term notify failed', email, err);
		}
	}

	dates[idx] = {
		...term,
		waitlistNotifiedAt: new Date().toISOString(),
	};
	await courseRef.update({ dates });

	return {
		ok: true,
		sent,
		skipped,
		failed,
		recipientCount: wlSnap.size,
	};
};

/** Run auto-notify for all newly opened terms on a course document update. */
export const autoNotifyWaitlistOnCourseUpdate = async (
	db: Firestore,
	input: {
		courseId: string;
		before: CourseDoc | undefined;
		after: CourseDoc;
	}
): Promise<void> => {
	const today = warsawTodayYmd();
	const candidates = findWaitlistNotifyCandidates({
		beforeDates: Array.isArray(input.before?.dates) ? input.before.dates : [],
		afterDates: Array.isArray(input.after.dates) ? input.after.dates : [],
		inactive: input.after.inactive === true,
		todayYmd: today,
	});
	for (const term of candidates) {
		const dateId = term.id;
		if (!dateId) continue;
		const result = await notifyWaitlistForTerm(db, {
			courseId: input.courseId,
			dateId,
			force: false,
			todayYmd: today,
		});
		if (!result.ok) {
			console.error('autoNotifyWaitlistOnCourseUpdate failed', input.courseId, dateId, result);
			continue;
		}
		console.info(
			'autoNotifyWaitlistOnCourseUpdate',
			input.courseId,
			dateId,
			`sent=${result.sent} skipped=${result.skipped} failed=${result.failed}`
		);
	}
};
