import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import {
	CONTACT_EMAIL,
	escapeHtml,
	sendMail,
	SITE_NAME,
	SITE_ORIGIN,
} from './mail';

export const DATE_NOTIFY_MAX_RECIPIENTS = 200;

const KNOWN_PLACEHOLDERS = [
	'firstName',
	'courseName',
	'level',
	'date',
	'time',
	'location',
	'mapLink',
	'instructor',
	'requirements',
	'price',
	'paymentStatus',
	'panelLink',
	'minimumInfo',
	'cancellationInfo',
	'contact',
] as const;

type PlaceholderKey = (typeof KNOWN_PLACEHOLDERS)[number];
type DateNotifyVars = Record<PlaceholderKey, string>;

const KNOWN = new Set<string>(KNOWN_PLACEHOLDERS);
const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

const LEVEL_LABEL: Record<string, string> = {
	basic: 'Podstawowy',
	intermediate: 'Średniozaawansowany',
	advanced: 'Zaawansowany',
};

const CANCELLATION_INFO =
	'Rezygnacja ze zwrotem 100% wpłaty jest możliwa najpóźniej 3 pełne dni przed datą Terminu. Późniejsza rezygnacja nie uprawnia do zwrotu. Wypis z Terminu jest zawsze dostępny w panelu uczestnika; skutki finansowe wynikają z Regulaminu.';

export const dateNotifyBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	subject: z.string().trim().min(1).max(200),
	bodyMarkdown: z.string().trim().min(1).max(20_000),
	recipientMode: z.enum(['confirmed', 'waitlist', 'manual']),
	manualParticipantIds: z.array(z.string().min(1)).max(200).optional(),
	idempotencyKey: z.string().uuid(),
	isTest: z.boolean().optional(),
	retryFailedOfMessageId: z.string().min(1).optional(),
});

export type DateNotifyBody = z.infer<typeof dateNotifyBodySchema>;

type ParticipantDoc = {
	id: string;
	name?: string;
	email?: string;
	paid?: boolean;
	paysByCash?: boolean;
	customPrice?: number;
};

type CourseDateDoc = {
	id: string;
	date?: string;
	timeStart?: string;
	slotsMax?: number;
	minParticipants?: number;
	minDecisionBy?: string;
	participants?: ParticipantDoc[];
	instructor?: { name?: string };
	place?: { name?: string; googleMapsLink?: string; link?: string };
	customPrice?: number;
	canceled?: boolean;
};

type CourseDoc = {
	name?: string;
	slug?: string;
	price?: number;
	level?: string;
	kind?: string;
	minParticipants?: number;
	minDecisionDaysBefore?: number;
	slotsMax?: number;
	dates?: CourseDateDoc[];
};

type WaitingListDoc = {
	userName?: string;
	email?: string;
};

export type DateNotifyResult = {
	ok: true;
	messageId: string;
	sent: number;
	failed: number;
	skipped: number;
	skippedInvalid: number;
	skippedDuplicate: number;
	recipientCount: number;
	status: string;
	idempotentReplay?: boolean;
};

export const isValidEmailAddress = (email: string): boolean =>
	z.string().email().safeParse(email).success;

export const findUnknownDateNotifyPlaceholders = (...templates: string[]): string[] => {
	const unknown = new Set<string>();
	for (const template of templates) {
		const matches = template.matchAll(/\{\{(\w+)\}\}/g);
		for (const match of matches) {
			const key = match[1];
			if (key && !KNOWN.has(key)) unknown.add(key);
		}
	}
	return [...unknown].sort();
};

export const escapeDateNotifyValue = (value: string): string =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('\\', '\\\\')
		.replaceAll('`', '\\`')
		.replaceAll('*', '\\*')
		.replaceAll('_', '\\_')
		.replaceAll('[', '\\[')
		.replaceAll(']', '\\]')
		.replaceAll('(', '\\(')
		.replaceAll(')', '\\)')
		.replaceAll('#', '\\#')
		.replaceAll('|', '\\|');

export const applyDateNotifyPlaceholders = (
	template: string,
	vars: DateNotifyVars
): string =>
	template.replace(PLACEHOLDER_RE, (_, key: string) => {
		if (!(key in vars)) return `{{${key}}}`;
		return escapeDateNotifyValue(vars[key as PlaceholderKey] ?? '');
	});

export const firstNameFromDisplayName = (name: string): string => {
	const trimmed = name.trim();
	if (!trimmed) return 'Uczestniku';
	return trimmed.split(/\s+/)[0] ?? trimmed;
};

const formatSessionDate = (ymd: string): string => {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
	if (!m) return ymd;
	return `${m[3]}.${m[2]}.${m[1]}`;
};

const roundMoney = (n: number): number => Math.round(n * 100) / 100;
const bruttoFromNetto = (netto: number): number => {
	const n = roundMoney(netto);
	return roundMoney(n + roundMoney(n * 0.23));
};

const inlineMd = (text: string): string =>
	text
		.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
		.replace(/<!--.*?-->/g, '');

export const markdownToEmailHtmlFragment = (markdown: string): string => {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const html: string[] = [];
	let inUl = false;
	let paragraph: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		html.push(
			`<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#191c1d;">${inlineMd(paragraph.join('<br />'))}</p>`
		);
		paragraph = [];
	};
	const closeUl = () => {
		if (!inUl) return;
		html.push('</ul>');
		inUl = false;
	};

	for (const line of lines) {
		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		const listItem = /^[-*]\s+(.+)$/.exec(line);
		if (heading) {
			flushParagraph();
			closeUl();
			const level = heading[1].length;
			const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
			const size = level === 1 ? 20 : 17;
			html.push(
				`<${tag} style="margin:18px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:${size}px;line-height:1.3;color:#191c1d;">${inlineMd(heading[2])}</${tag}>`
			);
			continue;
		}
		if (listItem) {
			flushParagraph();
			if (!inUl) {
				html.push(
					'<ul style="margin:0 0 14px;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#191c1d;">'
				);
				inUl = true;
			}
			html.push(`<li style="margin:0 0 6px;">${inlineMd(listItem[1])}</li>`);
			continue;
		}
		if (line.trim() === '') {
			flushParagraph();
			closeUl();
			continue;
		}
		if (inUl) closeUl();
		paragraph.push(line);
	}
	flushParagraph();
	closeUl();
	return html.join('\n');
};

export const markdownToPlaintext = (markdown: string): string =>
	markdown
		.replace(/\r\n/g, '\n')
		.replace(/<!--.*?-->/g, '')
		.replace(/^#{1,3}\s+/gm, '')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
		.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
		.replace(/^[-*]\s+/gm, '• ')
		.trim();

const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

export const buildDateNotifyHtml = (subject: string, bodyMarkdown: string): string => {
	const title = escapeHtml(subject);
	const bodyHtml = markdownToEmailHtmlFragment(bodyMarkdown);
	const site = escapeHtml(SITE_NAME);
	const contact = escapeHtml(CONTACT_EMAIL);
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
              ${bodyHtml}
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

type ResolvedRecipient = {
	id: string;
	email: string;
	name: string;
	participant?: ParticipantDoc;
};

const dedupeRecipients = (
	rows: ResolvedRecipient[]
): {
	recipients: ResolvedRecipient[];
	skippedInvalid: number;
	skippedDuplicate: number;
} => {
	const seen = new Set<string>();
	const recipients: ResolvedRecipient[] = [];
	let skippedInvalid = 0;
	let skippedDuplicate = 0;
	for (const row of rows) {
		const email = row.email.trim().toLowerCase();
		if (!email || !isValidEmailAddress(email)) {
			skippedInvalid += 1;
			continue;
		}
		if (seen.has(email)) {
			skippedDuplicate += 1;
			continue;
		}
		seen.add(email);
		recipients.push({ ...row, email });
	}
	return { recipients, skippedInvalid, skippedDuplicate };
};

const resolveRecipients = (input: {
	mode: DateNotifyBody['recipientMode'];
	participants: ParticipantDoc[];
	waitlist: Array<{ id: string; data: WaitingListDoc }>;
	manualParticipantIds?: string[];
}): {
	recipients: ResolvedRecipient[];
	skippedInvalid: number;
	skippedDuplicate: number;
} => {
	let raw: ResolvedRecipient[] = [];
	if (input.mode === 'confirmed') {
		raw = input.participants.map((p) => ({
			id: p.id,
			email: p.email ?? '',
			name: p.name ?? 'Uczestnik',
			participant: p,
		}));
	} else if (input.mode === 'waitlist') {
		raw = input.waitlist.map((e) => ({
			id: e.id,
			email: e.data.email ?? '',
			name: e.data.userName ?? 'Gość',
		}));
	} else {
		const selected = new Set(input.manualParticipantIds ?? []);
		raw = input.participants
			.filter((p) => selected.has(p.id))
			.map((p) => ({
				id: p.id,
				email: p.email ?? '',
				name: p.name ?? 'Uczestnik',
				participant: p,
			}));
	}
	return dedupeRecipients(raw);
};

const addCalendarDays = (ymd: string, days: number): string => {
	const [y, m, d] = ymd.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	const yy = dt.getUTCFullYear();
	const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(dt.getUTCDate()).padStart(2, '0');
	return `${yy}-${mm}-${dd}`;
};

const buildVars = (input: {
	course: CourseDoc;
	date: CourseDateDoc;
	recipientName: string;
	participant?: ParticipantDoc;
	requirementsText: string;
}): DateNotifyVars => {
	const { course, date, recipientName, participant, requirementsText } = input;
	const netto = roundMoney(
		participant?.customPrice ?? date.customPrice ?? course.price ?? 0
	);
	const brutto = bruttoFromNetto(netto);
	const slotsMax = date.slotsMax && date.slotsMax > 0 ? date.slotsMax : 12;
	const minRaw =
		typeof date.minParticipants === 'number' && date.minParticipants >= 1
			? Math.floor(date.minParticipants)
			: typeof course.minParticipants === 'number' && course.minParticipants >= 1
				? Math.floor(course.minParticipants)
				: 4;
	const min = Math.min(Math.max(1, minRaw), slotsMax);
	const daysBefore =
		typeof course.minDecisionDaysBefore === 'number' && course.minDecisionDaysBefore >= 0
			? Math.floor(course.minDecisionDaysBefore)
			: 7;
	const sessionDate = date.date ?? '';
	const deadlineRaw = date.minDecisionBy?.trim();
	const deadline =
		deadlineRaw && /^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw)
			? deadlineRaw > sessionDate
				? sessionDate
				: deadlineRaw
			: addCalendarDays(sessionDate, -daysBefore);
	const signed = date.participants?.length ?? 0;
	const paymentStatus = participant?.paid
		? 'opłacone'
		: participant?.paysByCash
			? 'płatność gotówką na miejscu'
			: 'oczekuje na płatność';
	const slug = course.slug?.trim() || '';
	const dateId = date.id;
	const panelLink = slug
		? `${SITE_ORIGIN}/profil/moje-szkolenia/${encodeURIComponent(slug)}/${encodeURIComponent(dateId)}`
		: SITE_ORIGIN;

	return {
		firstName: firstNameFromDisplayName(recipientName),
		courseName: course.name?.trim() || 'Szkolenie',
		level: LEVEL_LABEL[course.level ?? ''] ?? course.level ?? '',
		date: formatSessionDate(sessionDate),
		time: date.timeStart?.trim() || 'do potwierdzenia',
		location: date.place?.name?.trim() || 'do potwierdzenia',
		mapLink: date.place?.googleMapsLink?.trim() || date.place?.link?.trim() || '',
		instructor: date.instructor?.name?.trim() || 'do potwierdzenia',
		requirements: requirementsText.trim() || 'do potwierdzenia',
		price: `${brutto.toFixed(2)} zł brutto`,
		paymentStatus,
		panelLink,
		minimumInfo: `Termin wymaga minimum ${min} zapisanych (obecnie ${signed}). Decyzja organizatora o prowadzeniu przy niewystarczającej liczbie uczestników — do ${formatSessionDate(deadline)}. Serwis nie odwołuje Terminu automatycznie.`,
		cancellationInfo: CANCELLATION_INFO,
		contact: `E-mail: ${CONTACT_EMAIL}`,
	};
};

const formatRequirements = (data: {
	ownGun?: boolean;
	holster?: boolean;
	roundCount?: number;
} | null): string => {
	if (!data) return '';
	const parts: string[] = [];
	if (data.ownGun) parts.push('własna broń');
	if (data.holster) parts.push('kabura');
	if (typeof data.roundCount === 'number' && data.roundCount > 0) {
		parts.push(`ok. ${data.roundCount} szt. amunicji`);
	}
	return parts.join(', ');
};

const aggregateStatus = (
	sent: number,
	failed: number,
	recipientCount: number
): string => {
	if (recipientCount === 0) return 'failed';
	if (failed === 0 && sent > 0) return 'sent';
	if (sent === 0 && failed > 0) return 'failed';
	if (sent > 0 && failed > 0) return 'partiallyFailed';
	return 'failed';
};

const loadRequirementsText = async (
	db: Firestore,
	slug: string
): Promise<string> => {
	if (!slug) return '';
	const byId = await db.doc(`courseDescriptions/${slug}`).get();
	const data = byId.exists
		? byId.data()
		: (
				await db.collection('courseDescriptions').where('slug', '==', slug).limit(1).get()
			).docs[0]?.data();
	if (!data) return '';
	const req = data.requirements as
		| { ownGun?: boolean; holster?: boolean; roundCount?: number }
		| undefined;
	return formatRequirements(req ?? null);
};

export const sendDateNotify = async (
	db: Firestore,
	author: { uid: string; email: string | null },
	input: DateNotifyBody
): Promise<DateNotifyResult | { ok: false; error: string; code: string }> => {
	if (input.retryFailedOfMessageId) {
		return retryFailedDateNotify(db, author, input);
	}

	const unknown = findUnknownDateNotifyPlaceholders(input.subject, input.bodyMarkdown);
	if (unknown.length > 0) {
		return {
			ok: false,
			error: `Nieznane zmienne: ${unknown.map((k) => `{{${k}}}`).join(', ')}`,
			code: 'unknown_placeholders',
		};
	}

	const courseRef = db.doc(`courses/${input.courseId}`);
	const courseSnap = await courseRef.get();
	if (!courseSnap.exists) {
		return { ok: false, error: 'Kurs nie istnieje.', code: 'not_found' };
	}
	const course = courseSnap.data() as CourseDoc;
	const date = (course.dates ?? []).find((d) => d.id === input.dateId);
	if (!date) {
		return { ok: false, error: 'Termin nie istnieje.', code: 'not_found' };
	}

	const participants = (date.participants ?? []).map((p) => ({
		...p,
		id: p.id,
	}));

	let waitlist: Array<{ id: string; data: WaitingListDoc }> = [];
	if (input.recipientMode === 'waitlist' && !input.isTest) {
		const wlSnap = await db
			.collection('courseWaitingList')
			.where('courseId', '==', input.courseId)
			.get();
		waitlist = wlSnap.docs.map((d) => ({ id: d.id, data: d.data() as WaitingListDoc }));
	}

	const requirementsText = await loadRequirementsText(db, course.slug ?? '');
	const messageId = input.idempotencyKey;
	const messageRef = courseRef.collection('dateMessages').doc(messageId);

	const existing = await messageRef.get();
	if (existing.exists) {
		const data = existing.data() ?? {};
		return {
			ok: true,
			messageId,
			sent: typeof data.sentCount === 'number' ? data.sentCount : 0,
			failed: typeof data.failedCount === 'number' ? data.failedCount : 0,
			skipped: 0,
			skippedInvalid: 0,
			skippedDuplicate: 0,
			recipientCount: typeof data.recipientCount === 'number' ? data.recipientCount : 0,
			status: typeof data.status === 'string' ? data.status : 'sent',
			idempotentReplay: true,
		};
	}

	const isTest = input.isTest === true;
	let resolved: ResolvedRecipient[];
	let skippedInvalid = 0;
	let skippedDuplicate = 0;

	if (isTest) {
		const adminEmail = (author.email ?? '').trim().toLowerCase();
		if (!adminEmail || !isValidEmailAddress(adminEmail)) {
			return {
				ok: false,
				error: 'Konto admina nie ma prawidłowego adresu e-mail.',
				code: 'no_admin_email',
			};
		}
		const sample = participants[0];
		resolved = [
			{
				id: author.uid,
				email: adminEmail,
				name: sample?.name ?? 'Admin',
				participant: sample,
			},
		];
	} else {
		const result = resolveRecipients({
			mode: input.recipientMode,
			participants,
			waitlist,
			manualParticipantIds: input.manualParticipantIds,
		});
		resolved = result.recipients;
		skippedInvalid = result.skippedInvalid;
		skippedDuplicate = result.skippedDuplicate;
	}

	if (resolved.length === 0) {
		return { ok: false, error: 'Brak odbiorców do wysyłki.', code: 'empty' };
	}
	if (resolved.length > DATE_NOTIFY_MAX_RECIPIENTS) {
		return {
			ok: false,
			error: `Za dużo odbiorców (${resolved.length}). Limit: ${DATE_NOTIFY_MAX_RECIPIENTS}.`,
			code: 'too_many',
		};
	}

	const now = new Date().toISOString();
	try {
		await messageRef.create({
			courseId: input.courseId,
			dateId: input.dateId,
			authorId: author.uid,
			subject: input.subject,
			bodyMarkdown: input.bodyMarkdown,
			recipientMode: input.recipientMode,
			...(input.recipientMode === 'manual'
				? { manualParticipantIds: input.manualParticipantIds ?? [] }
				: {}),
			status: 'sending',
			isTest,
			recipientCount: resolved.length,
			sentCount: 0,
			failedCount: 0,
			createdAt: now,
		});
	} catch (err) {
		const code =
			err && typeof err === 'object' && 'code' in err
				? String((err as { code?: unknown }).code)
				: '';
		if (code === '6' || code.includes('ALREADY_EXISTS')) {
			const again = await messageRef.get();
			const data = again.data() ?? {};
			return {
				ok: true,
				messageId,
				sent: typeof data.sentCount === 'number' ? data.sentCount : 0,
				failed: typeof data.failedCount === 'number' ? data.failedCount : 0,
				skipped: 0,
				skippedInvalid: 0,
				skippedDuplicate: 0,
				recipientCount: typeof data.recipientCount === 'number' ? data.recipientCount : 0,
				status: typeof data.status === 'string' ? data.status : 'sent',
				idempotentReplay: true,
			};
		}
		throw err;
	}

	const recipientsCol = messageRef.collection('recipients');
	let sent = 0;
	let failed = 0;

	for (const recipient of resolved) {
		const vars = buildVars({
			course,
			date,
			recipientName: recipient.name,
			participant: recipient.participant,
			requirementsText,
		});
		const renderedSubjectRaw = applyDateNotifyPlaceholders(input.subject, vars);
		const renderedSubject = isTest ? `[TEST] ${renderedSubjectRaw}` : renderedSubjectRaw;
		const renderedBodyMd = applyDateNotifyPlaceholders(input.bodyMarkdown, vars);
		const renderedHtml = buildDateNotifyHtml(renderedSubject, renderedBodyMd);
		const renderedText = markdownToPlaintext(renderedBodyMd);

		const recipientRef = recipientsCol.doc(recipient.id);
		await recipientRef.set({
			email: recipient.email,
			name: recipient.name,
			renderedSubject,
			renderedHtml,
			renderedText,
			status: 'pending',
			attempts: 0,
		});

		try {
			const mailResult = await sendMail({
				to: recipient.email,
				subject: renderedSubject,
				html: renderedHtml,
				text: renderedText,
			});
			if (mailResult.sent) {
				sent += 1;
				await recipientRef.set(
					{
						status: 'sent',
						attempts: 1,
						sentAt: new Date().toISOString(),
					},
					{ merge: true }
				);
			} else {
				failed += 1;
				await recipientRef.set(
					{
						status: 'failed',
						attempts: 1,
						error: mailResult.reason ?? 'send_failed',
					},
					{ merge: true }
				);
			}
		} catch (err) {
			failed += 1;
			const message = err instanceof Error ? err.message : 'send_failed';
			console.error('Date notify email failed', recipient.email, err);
			await recipientRef.set(
				{
					status: 'failed',
					attempts: 1,
					error: message.slice(0, 200),
				},
				{ merge: true }
			);
		}
	}

	const status = aggregateStatus(sent, failed, resolved.length);
	await messageRef.set(
		{
			status,
			sentCount: sent,
			failedCount: failed,
			sentAt: new Date().toISOString(),
		},
		{ merge: true }
	);

	return {
		ok: true,
		messageId,
		sent,
		failed,
		skipped: skippedInvalid + skippedDuplicate,
		skippedInvalid,
		skippedDuplicate,
		recipientCount: resolved.length,
		status,
	};
};

const retryFailedDateNotify = async (
	db: Firestore,
	_author: { uid: string; email: string | null },
	input: DateNotifyBody
): Promise<DateNotifyResult | { ok: false; error: string; code: string }> => {
	const messageId = input.retryFailedOfMessageId!;
	const messageRef = db.doc(`courses/${input.courseId}/dateMessages/${messageId}`);
	const messageSnap = await messageRef.get();
	if (!messageSnap.exists) {
		return { ok: false, error: 'Wiadomość nie istnieje.', code: 'not_found' };
	}
	const message = messageSnap.data() ?? {};
	if (message.dateId !== input.dateId) {
		return { ok: false, error: 'Wiadomość nie należy do tego terminu.', code: 'mismatch' };
	}

	const failedSnap = await messageRef.collection('recipients').where('status', '==', 'failed').get();
	if (failedSnap.empty) {
		return {
			ok: true,
			messageId,
			sent: 0,
			failed: 0,
			skipped: 0,
			skippedInvalid: 0,
			skippedDuplicate: 0,
			recipientCount: 0,
			status: typeof message.status === 'string' ? message.status : 'sent',
		};
	}
	if (failedSnap.size > DATE_NOTIFY_MAX_RECIPIENTS) {
		return {
			ok: false,
			error: `Za dużo nieudanych odbiorców (${failedSnap.size}).`,
			code: 'too_many',
		};
	}

	await messageRef.set({ status: 'sending' }, { merge: true });

	let sent = 0;
	let failed = 0;
	for (const doc of failedSnap.docs) {
		const data = doc.data();
		const email = typeof data.email === 'string' ? data.email : '';
		const renderedSubject =
			typeof data.renderedSubject === 'string' ? data.renderedSubject : '';
		const renderedHtml = typeof data.renderedHtml === 'string' ? data.renderedHtml : '';
		const renderedText = typeof data.renderedText === 'string' ? data.renderedText : '';
		const attempts = typeof data.attempts === 'number' ? data.attempts : 0;

		if (!email || !renderedSubject || !renderedHtml) {
			failed += 1;
			continue;
		}

		try {
			const mailResult = await sendMail({
				to: email,
				subject: renderedSubject,
				html: renderedHtml,
				text: renderedText || renderedSubject,
			});
			if (mailResult.sent) {
				sent += 1;
				await doc.ref.set(
					{
						status: 'sent',
						attempts: attempts + 1,
						sentAt: new Date().toISOString(),
						error: FieldValue.delete(),
					},
					{ merge: true }
				);
			} else {
				failed += 1;
				await doc.ref.set(
					{
						status: 'failed',
						attempts: attempts + 1,
						error: mailResult.reason ?? 'send_failed',
					},
					{ merge: true }
				);
			}
		} catch (err) {
			failed += 1;
			const errMsg = err instanceof Error ? err.message : 'send_failed';
			await doc.ref.set(
				{
					status: 'failed',
					attempts: attempts + 1,
					error: errMsg.slice(0, 200),
				},
				{ merge: true }
			);
		}
	}

	const allRecipients = await messageRef.collection('recipients').get();
	let totalSent = 0;
	let totalFailed = 0;
	for (const doc of allRecipients.docs) {
		const st = doc.data().status;
		if (st === 'sent') totalSent += 1;
		else if (st === 'failed') totalFailed += 1;
	}
	const status = aggregateStatus(totalSent, totalFailed, allRecipients.size);
	await messageRef.set(
		{
			status,
			sentCount: totalSent,
			failedCount: totalFailed,
			sentAt: new Date().toISOString(),
		},
		{ merge: true }
	);

	return {
		ok: true,
		messageId,
		sent,
		failed,
		skipped: 0,
		skippedInvalid: 0,
		skippedDuplicate: 0,
		recipientCount: failedSnap.size,
		status,
	};
};
