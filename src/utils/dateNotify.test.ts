import { describe, expect, it } from 'vitest';
import {
	DEFAULT_DATE_NOTIFY_BODY_MARKDOWN,
	DEFAULT_DATE_NOTIFY_SUBJECT,
} from '@constants/dateNotifyTemplate';
import type { Course, CourseClass, Participant } from '@/types/course';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import {
	applyDateNotifyPlaceholders,
	buildDateNotifyVars,
	escapeDateNotifyValue,
	findUnknownDateNotifyPlaceholders,
	firstNameFromDisplayName,
	formatDateNotifySessionDate,
	markdownToEmailHtmlFragment,
	markdownToPlaintext,
	resolveDateNotifyRecipients,
} from './dateNotify';

const course = {
	id: 'c1',
	name: 'IDPA Compact',
	slug: 'idpa-compact',
	description: '',
	price: 100,
	hours: 4,
	tags: [],
	level: 'basic',
	minParticipants: 4,
	minDecisionDaysBefore: 7,
	slotsMax: 12,
} as Course;

const date = {
	id: 'd1',
	slotsMax: 12,
	minParticipants: 4,
	minDecisionBy: '2026-11-01',
	date: '2026-11-10',
	timeStart: '09:00',
	participants: [],
	instructor: { id: 'i1', name: 'Piotr', slug: 'piotr', bio: '' },
	place: {
		id: 'p1',
		name: 'Strzelnica',
		slug: 'strzelnica',
		googleMapsLink: 'https://maps.example/x',
	},
} as CourseClass;

const participant = {
	id: 'u1',
	name: 'Anna Kowalska',
	email: 'anna@example.com',
	paid: true,
} as Participant;

describe('firstNameFromDisplayName', () => {
	it('takes first token', () => {
		expect(firstNameFromDisplayName('Anna Kowalska')).toBe('Anna');
		expect(firstNameFromDisplayName('')).toBe('Uczestniku');
	});
});

describe('formatDateNotifySessionDate', () => {
	it('formats YYYY-MM-DD as PL', () => {
		expect(formatDateNotifySessionDate('2026-11-10')).toBe('10.11.2026');
	});
});

describe('findUnknownDateNotifyPlaceholders', () => {
	it('detects unknown keys', () => {
		expect(findUnknownDateNotifyPlaceholders('Hi {{firstName}} {{foo}}')).toEqual(['foo']);
		expect(
			findUnknownDateNotifyPlaceholders(DEFAULT_DATE_NOTIFY_SUBJECT, DEFAULT_DATE_NOTIFY_BODY_MARKDOWN)
		).toEqual([]);
	});
});

describe('applyDateNotifyPlaceholders', () => {
	it('substitutes and escapes values', () => {
		const vars = buildDateNotifyVars({
			course,
			date,
			recipientName: participant.name,
			participant,
			requirementsText: 'własna broń',
		});
		const out = applyDateNotifyPlaceholders('Cześć {{firstName}} — {{courseName}}', vars);
		expect(out).toContain('Anna');
		expect(out).toContain('IDPA Compact');
		expect(escapeDateNotifyValue('a*b')).toContain('\\*');
	});

	it('leaves unknown intact', () => {
		const vars = buildDateNotifyVars({
			course,
			date,
			recipientName: 'X',
			participant,
		});
		expect(applyDateNotifyPlaceholders('{{unknown}}', vars)).toBe('{{unknown}}');
	});
});

describe('resolveDateNotifyRecipients', () => {
	const participants: Participant[] = [
		{ id: 'u1', name: 'A', email: 'a@example.com' },
		{ id: 'u2', name: 'B', email: 'b@example.com' },
		{ id: 'u3', name: 'Dup', email: 'a@example.com' },
		{ id: 'u4', name: 'NoMail', email: '' },
	];
	const waitlist: CourseWaitingListEntry[] = [
		{
			id: 'w1',
			courseId: 'c1',
			courseName: 'IDPA',
			courseSlug: 'idpa',
			userName: 'Wait',
			email: 'wait@example.com',
			createdAt: '2026-01-01T00:00:00.000Z',
		},
	];

	it('confirmed mode dedupes email and skips invalid', () => {
		const r = resolveDateNotifyRecipients({
			mode: 'confirmed',
			participants,
			waitlistEntries: waitlist,
		});
		expect(r.recipients.map((x) => x.id)).toEqual(['u1', 'u2']);
		expect(r.skippedDuplicate).toBe(1);
		expect(r.skippedInvalid).toBe(1);
	});

	it('waitlist mode uses course waitlist', () => {
		const r = resolveDateNotifyRecipients({
			mode: 'waitlist',
			participants,
			waitlistEntries: waitlist,
		});
		expect(r.recipients).toHaveLength(1);
		expect(r.recipients[0].email).toBe('wait@example.com');
	});

	it('manual mode filters by ids', () => {
		const r = resolveDateNotifyRecipients({
			mode: 'manual',
			participants,
			waitlistEntries: waitlist,
			manualParticipantIds: ['u2'],
		});
		expect(r.recipients).toHaveLength(1);
		expect(r.recipients[0].id).toBe('u2');
	});
});

describe('markdown helpers', () => {
	it('renders headings lists and bold', () => {
		const html = markdownToEmailHtmlFragment('## Hello\n\n- **one**\n- two\n\nPara');
		expect(html).toContain('<h3');
		expect(html).toContain('<ul');
		expect(html).toContain('<strong>one</strong>');
		expect(html).toContain('<p');
	});

	it('strips to plaintext', () => {
		expect(markdownToPlaintext('**Hi** [x](https://a.pl)')).toContain('Hi');
		expect(markdownToPlaintext('**Hi** [x](https://a.pl)')).toContain('https://a.pl');
	});
});
