/**
 * Find (and optionally repair) course date entries hidden from public
 * „Najbliższe szkolenia” after an unedited clone kept a past/malformed date.
 *
 * Dry-run by default (lists affected docs, writes nothing).
 *
 * Usage (ADC / GOOGLE_APPLICATION_CREDENTIALS):
 *   pnpm --dir functions exec tsx scripts/repair-hidden-cloned-dates.ts
 *   pnpm --dir functions exec tsx scripts/repair-hidden-cloned-dates.ts --apply
 *   pnpm --dir functions exec tsx scripts/repair-hidden-cloned-dates.ts --apply \
 *     --course-id=COURSE --date-id=DATE --set-date=YYYY-MM-DD
 *
 * Safe --apply without --set-date:
 *   - coerces Timestamp / Date / ISO strings on `date` (and `minDecisionBy`) to YYYY-MM-DD
 *   - does NOT invent new calendar dates for past duplicates
 *
 * Targeted --apply --course-id --date-id --set-date:
 *   - sets that term's date (and shifts minDecisionBy by the same gap when present)
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID =
	process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'szkolenia-glocksklep';

if (getApps().length === 0) {
	initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const argValue = (name: string): string | undefined => {
	const prefix = `${name}=`;
	const hit = process.argv.slice(2).find((a) => a.startsWith(prefix));
	return hit ? hit.slice(prefix.length) : undefined;
};

const courseIdFilter = argValue('--course-id');
const dateIdFilter = argValue('--date-id');
const setDate = argValue('--set-date');

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

const warsawToday = (): string =>
	new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Warsaw',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date());

const toYmd = (value: unknown): string | null => {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (YMD_RE.test(trimmed)) return trimmed;
		const isoDay = trimmed.slice(0, 10);
		if (YMD_RE.test(isoDay) && trimmed.includes('T')) return isoDay;
		return null;
	}
	if (value instanceof Timestamp) {
		return value.toDate().toISOString().slice(0, 10);
	}
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}
	if (
		value &&
		typeof value === 'object' &&
		'toDate' in value &&
		typeof (value as { toDate: () => Date }).toDate === 'function'
	) {
		const d = (value as { toDate: () => Date }).toDate();
		if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
	}
	if (value && typeof value === 'object' && 'seconds' in value) {
		const seconds = Number((value as { seconds: number }).seconds);
		if (Number.isFinite(seconds)) {
			return new Date(seconds * 1000).toISOString().slice(0, 10);
		}
	}
	return null;
};

const addCalendarDays = (ymd: string, days: number): string => {
	const [y, m, d] = ymd.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	return dt.toISOString().slice(0, 10);
};

type DateRow = Record<string, unknown> & { id?: string };

type Finding = {
	courseId: string;
	courseName: string;
	dateId: string;
	dateRaw: unknown;
	dateYmd: string | null;
	reasons: string[];
	repair: 'normalize-date' | 'set-date' | 'none';
	proposedDate?: string;
	proposedMinDecisionBy?: string;
};

const main = async () => {
	const today = warsawToday();
	const snap = await db.collection('courses').get();
	const findings: Finding[] = [];

	for (const doc of snap.docs) {
		if (courseIdFilter && doc.id !== courseIdFilter) continue;
		const data = doc.data();
		const courseName = typeof data.name === 'string' ? data.name : doc.id;
		const inactive = data.inactive === true;
		const dates = Array.isArray(data.dates) ? (data.dates as DateRow[]) : [];

		const byCalendar = new Map<string, DateRow[]>();
		for (const row of dates) {
			const ymd = toYmd(row.date);
			if (!ymd) continue;
			const list = byCalendar.get(ymd) ?? [];
			list.push(row);
			byCalendar.set(ymd, list);
		}

		for (const row of dates) {
			const dateId = typeof row.id === 'string' ? row.id : '';
			if (dateIdFilter && dateId !== dateIdFilter) continue;

			const reasons: string[] = [];
			const dateYmd = toYmd(row.date);
			const canceled = row.canceled === true;
			const roster = Array.isArray(row.participants) ? row.participants : [];

			if (inactive) reasons.push('course_inactive');
			if (canceled) reasons.push('canceled');
			if (!dateYmd) reasons.push('malformed_date');
			else if (dateYmd < today) reasons.push('past_date');

			const siblingsSameDay =
				dateYmd && (byCalendar.get(dateYmd)?.length ?? 0) > 1 ? byCalendar.get(dateYmd)! : [];
			const looksLikeUneditedClone =
				roster.length === 0 &&
				siblingsSameDay.length > 1 &&
				siblingsSameDay.some((s) => s.id !== row.id);

			if (looksLikeUneditedClone) reasons.push('duplicate_calendar_date_empty_roster');

			const needsNormalize =
				dateYmd != null &&
				(typeof row.date !== 'string' || !YMD_RE.test(String(row.date).trim()));

			const hiddenFromPublic =
				inactive || canceled || !dateYmd || dateYmd < today || needsNormalize;

			if (!hiddenFromPublic && !looksLikeUneditedClone) continue;
			if (reasons.length === 0 && !needsNormalize) continue;

			let repair: Finding['repair'] = 'none';
			let proposedDate: string | undefined;
			let proposedMinDecisionBy: string | undefined;

			if (setDate && courseIdFilter && dateIdFilter && dateId === dateIdFilter) {
				if (!YMD_RE.test(setDate)) {
					throw new Error(`--set-date must be YYYY-MM-DD, got ${setDate}`);
				}
				repair = 'set-date';
				proposedDate = setDate;
				const rawMin = toYmd(row.minDecisionBy);
				if (dateYmd && rawMin) {
					const gap = Math.round(
						(Date.parse(`${dateYmd}T12:00:00Z`) - Date.parse(`${rawMin}T12:00:00Z`)) /
							86_400_000
					);
					proposedMinDecisionBy = addCalendarDays(setDate, -Math.max(0, gap));
				}
			} else if (needsNormalize && dateYmd) {
				repair = 'normalize-date';
				proposedDate = dateYmd;
				const rawMin = row.minDecisionBy;
				const minYmd = toYmd(rawMin);
				if (minYmd && (typeof rawMin !== 'string' || !YMD_RE.test(String(rawMin).trim()))) {
					proposedMinDecisionBy = minYmd;
				}
			}

			findings.push({
				courseId: doc.id,
				courseName,
				dateId: dateId || '(missing-id)',
				dateRaw: row.date,
				dateYmd,
				reasons: needsNormalize ? [...reasons, 'non_string_date'] : reasons,
				repair,
				proposedDate,
				proposedMinDecisionBy,
			});
		}
	}

	console.log(
		JSON.stringify(
			{
				mode: apply ? 'apply' : 'dry-run',
				today,
				count: findings.length,
				findings,
			},
			null,
			2
		)
	);

	if (!apply) {
		console.error(
			`\nDry-run only (${findings.length} finding(s)). Re-run with --apply to write safe normalizations, or --apply --course-id=… --date-id=… --set-date=YYYY-MM-DD for a targeted date fix.`
		);
		return;
	}

	const writable = findings.filter((f) => f.repair !== 'none' && f.proposedDate);
	if (writable.length === 0) {
		console.error('Nothing to write (no normalize/set-date repairs selected).');
		return;
	}

	let written = 0;
	for (const f of writable) {
		const ref = db.collection('courses').doc(f.courseId);
		await db.runTransaction(async (tx) => {
			const snapDoc = await tx.get(ref);
			if (!snapDoc.exists) return;
			const data = snapDoc.data() ?? {};
			const dates = Array.isArray(data.dates) ? [...(data.dates as DateRow[])] : [];
			const idx = dates.findIndex((d) => d.id === f.dateId);
			if (idx < 0) return;
			const next = { ...dates[idx], date: f.proposedDate };
			if (f.proposedMinDecisionBy) next.minDecisionBy = f.proposedMinDecisionBy;
			dates[idx] = next;
			tx.update(ref, { dates });
			written += 1;
		});
	}

	console.error(`Wrote repairs for ${written} date(s).`);
};

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
