import { COURSE_LEVEL_LABEL } from '@constants/courses';
import {
	DATE_NOTIFY_CANCELLATION_INFO,
	DATE_NOTIFY_PLACEHOLDER_KEYS,
	type DateNotifyPlaceholderKey,
} from '@constants/dateNotifyTemplate';
import { CONTACT_EMAIL } from '@constants/contact';
import { Paths } from '@constants/paths';
import { SITE_ORIGIN } from '@constants/seo';
import type { Course, CourseClass, Participant } from '@/types/course';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import {
	resolveDateMinDecisionBy,
	resolveDateMinParticipants,
	signedUpCount,
} from '@/utils/minParticipants';
import { fillPath } from '@/utils/paths';
import { bruttoFromNetto, effectiveEnrollmentNetto, formatMoney } from '@/utils/pricing';

export type DateNotifyRecipientMode = 'confirmed' | 'waitlist' | 'manual';

export type DateNotifyVars = Record<DateNotifyPlaceholderKey, string>;

export type DateNotifyResolvedRecipient = {
	id: string;
	email: string;
	name: string;
	/** Present for enrolled participants; absent for waitlist-only rows. */
	participant?: Participant;
};

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;
const KNOWN = new Set<string>(DATE_NOTIFY_PLACEHOLDER_KEYS);

/** Escape so substituted values cannot inject HTML or Markdown structure. */
export const escapeDateNotifyValue = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\*/g, '\\*')
		.replace(/_/g, '\\_')
		.replace(/\[/g, '\\[')
		.replace(/]/g, '\\]')
		.replace(/\(/g, '\\(')
		.replace(/\)/g, '\\)')
		.replace(/#/g, '\\#')
		.replace(/\|/g, '\\|');

/** First token of a display name, or fallback. */
export const firstNameFromDisplayName = (name: string): string => {
	const trimmed = name.trim();
	if (!trimmed) return 'Uczestniku';
	return trimmed.split(/\s+/)[0] ?? trimmed;
};

export const formatDateNotifySessionDate = (ymd: string): string => {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
	if (!m) return ymd;
	const [, y, mo, d] = m;
	return `${d}.${mo}.${y}`;
};

export const formatDateNotifyPaymentStatus = (
	participant: Pick<Participant, 'paid' | 'paysByCash'> | null | undefined
): string => {
	if (participant?.paid) return 'opłacone';
	if (participant?.paysByCash) return 'płatność gotówką na miejscu';
	return 'oczekuje na płatność';
};

export const formatDateNotifyRequirements = (input: {
	ownGun?: boolean;
	holster?: boolean;
	roundCount?: number;
} | null | undefined): string => {
	if (!input) return 'do potwierdzenia';
	const parts: string[] = [];
	if (input.ownGun) parts.push('własna broń');
	if (input.holster) parts.push('kabura');
	if (typeof input.roundCount === 'number' && input.roundCount > 0) {
		parts.push(`ok. ${input.roundCount} szt. amunicji`);
	}
	return parts.length > 0 ? parts.join(', ') : 'do potwierdzenia';
};

export const buildDateNotifyMinimumInfo = (
	course: Pick<Course, 'kind' | 'minParticipants' | 'minDecisionDaysBefore' | 'slotsMax'> | null,
	date: Pick<CourseClass, 'minParticipants' | 'slotsMax' | 'participants' | 'date' | 'minDecisionBy'>
): string => {
	const min = resolveDateMinParticipants(course, date);
	const deadline = resolveDateMinDecisionBy(course, date);
	const signed = signedUpCount(date as Pick<CourseClass, 'participants'>);
	return `Termin wymaga minimum ${min} zapisanych (obecnie ${signed}). Decyzja organizatora o prowadzeniu przy niewystarczającej liczbie uczestników — do ${formatDateNotifySessionDate(deadline)}. Serwis nie odwołuje Terminu automatycznie.`;
};

export const buildDateNotifyContact = (): string =>
	`E-mail: ${CONTACT_EMAIL}`;

export const buildDateNotifyPanelLink = (courseSlug: string, dateId: string): string => {
	const path = fillPath(Paths.szkolenieSzczegoly, { slug: courseSlug, dateId });
	return `${SITE_ORIGIN.replace(/\/$/, '')}${path}`;
};

export const buildDateNotifyVars = (input: {
	course: Course;
	date: CourseClass;
	recipientName: string;
	participant?: Participant | null;
	requirementsText?: string;
}): DateNotifyVars => {
	const { course, date, recipientName, participant, requirementsText } = input;
	const netto = effectiveEnrollmentNetto(course, date, participant ?? undefined);
	const brutto = bruttoFromNetto(netto);
	const location = date.place?.name?.trim() || 'do potwierdzenia';
	const mapLink = date.place?.googleMapsLink?.trim() || date.place?.link?.trim() || '';
	const instructor = date.instructor?.name?.trim() || 'do potwierdzenia';
	const level = COURSE_LEVEL_LABEL[course.level] ?? course.level;

	return {
		firstName: firstNameFromDisplayName(recipientName),
		courseName: course.name.trim() || 'Szkolenie',
		level,
		date: formatDateNotifySessionDate(date.date),
		time: date.timeStart?.trim() || 'do potwierdzenia',
		location,
		mapLink,
		instructor,
		requirements: requirementsText?.trim() || 'do potwierdzenia',
		price: `${formatMoney(brutto)} zł brutto`,
		paymentStatus: formatDateNotifyPaymentStatus(participant),
		panelLink: buildDateNotifyPanelLink(course.slug, date.id),
		minimumInfo: buildDateNotifyMinimumInfo(course, date),
		cancellationInfo: DATE_NOTIFY_CANCELLATION_INFO,
		contact: buildDateNotifyContact(),
	};
};

/** List unknown `{{keys}}` in template (subject + body). Empty = ok. */
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

export const applyDateNotifyPlaceholders = (
	template: string,
	vars: DateNotifyVars,
	options?: { escapeValues?: boolean }
): string => {
	const shouldEscape = options?.escapeValues !== false;
	return template.replace(PLACEHOLDER_RE, (_, key: string) => {
		if (!(key in vars)) return `{{${key}}}`;
		const raw = vars[key as DateNotifyPlaceholderKey] ?? '';
		return shouldEscape ? escapeDateNotifyValue(raw) : raw;
	});
};

const isValidEmail = (email: string): boolean =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Dedupe by normalized email; keep first occurrence. Skip invalid/empty emails. */
export const dedupeDateNotifyRecipients = (
	rows: DateNotifyResolvedRecipient[]
): {
	recipients: DateNotifyResolvedRecipient[];
	skippedInvalid: number;
	skippedDuplicate: number;
} => {
	const seen = new Set<string>();
	const recipients: DateNotifyResolvedRecipient[] = [];
	let skippedInvalid = 0;
	let skippedDuplicate = 0;
	for (const row of rows) {
		const email = row.email.trim().toLowerCase();
		if (!email || !isValidEmail(email)) {
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

export const resolveDateNotifyRecipients = (input: {
	mode: DateNotifyRecipientMode;
	participants: Participant[];
	waitlistEntries: CourseWaitingListEntry[];
	manualParticipantIds?: string[];
}): {
	recipients: DateNotifyResolvedRecipient[];
	skippedInvalid: number;
	skippedDuplicate: number;
} => {
	const { mode, participants, waitlistEntries, manualParticipantIds } = input;
	let raw: DateNotifyResolvedRecipient[] = [];

	if (mode === 'confirmed') {
		raw = participants.map((p) => ({
			id: p.id,
			email: p.email,
			name: p.name,
			participant: p,
		}));
	} else if (mode === 'waitlist') {
		raw = waitlistEntries.map((e) => ({
			id: e.id,
			email: e.email,
			name: e.userName,
		}));
	} else {
		const selected = new Set(manualParticipantIds ?? []);
		raw = participants
			.filter((p) => selected.has(p.id))
			.map((p) => ({
				id: p.id,
				email: p.email,
				name: p.name,
				participant: p,
			}));
	}

	return dedupeDateNotifyRecipients(raw);
};

/**
 * Lightweight Markdown → HTML for transactional email (allowlisted tags).
 * Values should already be escaped via `applyDateNotifyPlaceholders`.
 */
export const markdownToEmailHtmlFragment = (markdown: string): string => {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const html: string[] = [];
	let inUl = false;
	let paragraph: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		const text = paragraph.join('<br />');
		html.push(`<p style="margin:0 0 14px;">${inlineMd(text)}</p>`);
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
			html.push(
				`<${tag} style="margin:18px 0 10px;font-size:${level === 1 ? 20 : 17}px;line-height:1.3;">${inlineMd(heading[2])}</${tag}>`
			);
			continue;
		}
		if (listItem) {
			flushParagraph();
			if (!inUl) {
				html.push('<ul style="margin:0 0 14px;padding-left:20px;">');
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

const inlineMd = (text: string): string =>
	text
		.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
		.replace(/<!--.*?-->/g, '');

/** Strip markdown to approximate plaintext for multipart. */
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
