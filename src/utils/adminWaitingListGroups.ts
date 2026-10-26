import type { CourseWaitingListEntry } from '@/types/courseWaitingList';

export type WaitingListCourseGroup = {
	courseId: string;
	courseName: string;
	courseSlug: string;
	entries: CourseWaitingListEntry[];
};

/** Case-insensitive match on name or email. */
export const filterWaitingListEntries = (
	entries: CourseWaitingListEntry[],
	search: string
): CourseWaitingListEntry[] => {
	const q = search.trim().toLowerCase();
	if (!q) return entries;
	return entries.filter(
		(e) => e.userName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
	);
};

/** FIFO within each course: oldest `createdAt` first. Groups sorted by course name. */
export const groupWaitingListByCourse = (
	entries: CourseWaitingListEntry[]
): WaitingListCourseGroup[] => {
	const byCourse = new Map<string, WaitingListCourseGroup>();
	for (const entry of entries) {
		const existing = byCourse.get(entry.courseId);
		if (existing) {
			existing.entries.push(entry);
			continue;
		}
		byCourse.set(entry.courseId, {
			courseId: entry.courseId,
			courseName: entry.courseName,
			courseSlug: entry.courseSlug,
			entries: [entry],
		});
	}
	const groups = [...byCourse.values()];
	for (const group of groups) {
		group.entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}
	groups.sort((a, b) => a.courseName.localeCompare(b.courseName, 'pl'));
	return groups;
};

export const WAITLIST_NOTIFY_PLACEHOLDERS = [
	{ key: 'participantName', label: 'imię (participantName)' },
	{ key: 'imie', label: 'imię (imie)' },
	{ key: 'courseName', label: 'nazwa kursu' },
	{ key: 'courseUrl', label: 'link do kursu' },
] as const;

export const DEFAULT_WAITLIST_NOTIFY_SUBJECT = 'Lista oczekujących — {{courseName}}';

export const DEFAULT_WAITLIST_NOTIFY_BODY = [
	'Cześć {{participantName}},',
	'',
	'Mamy informację dotyczącą szkolenia „{{courseName}}” — pojawiło się wolne miejsce lub nowy termin.',
	'',
	'Szczegóły i zapis: {{courseUrl}}',
	'',
	'Pozdrawiamy,',
	'GLOCKSKLEP Szkolenia',
].join('\n');
