import type { CourseDebriefing } from '@/types/courseDebriefing';

/** Formats ISO / date string for participant-facing “ostatnia aktualizacja”. */
export const formatDebriefingUpdatedAt = (value: string | undefined): string | null => {
	if (!value?.trim()) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toLocaleString('pl-PL', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

/** e.g. "Wersja 3 · aktualizacja 19.10.2026, 21:15" */
export const formatDebriefingMeta = (
	debriefing: Pick<CourseDebriefing, 'version' | 'updatedAt'>
): string | null => {
	const updated = formatDebriefingUpdatedAt(debriefing.updatedAt);
	const version =
		typeof debriefing.version === 'number' && debriefing.version > 0
			? debriefing.version
			: null;
	if (version && updated) return `Wersja ${version} · aktualizacja ${updated}`;
	if (version) return `Wersja ${version}`;
	if (updated) return `Aktualizacja ${updated}`;
	return null;
};
