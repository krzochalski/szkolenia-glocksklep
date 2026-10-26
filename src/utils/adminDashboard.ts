/**
 * Admin ops dashboard aggregators.
 *
 * Revenue rule: count a signup when `Participant.paid === true` (admin-confirmed
 * transfer/cash). Amount = `date.customPrice ?? course.price` (PLN netto).
 * Month bucket = session calendar date (`CourseClass.date` YYYY-MM-DD) in
 * Europe/Warsaw calendar months. When online payments exist, swap the paid
 * filter to the payment-status enum without changing the rest of the pipeline.
 */

import { COURSE_KIND_LABEL, getCourseKind } from '@/utils/courseKind';
import { getSlotsLeft, isLowSlotsLeft } from '@/utils/courseDates';
import { bruttoFromNetto, roundMoney } from '@/utils/pricing';
import type { Course, CourseClass } from '@/types/course';

export type SessionStatus = 'open' | 'full' | 'cancelled';

export type SignupsSpotlightItem = {
	readonly courseId: string;
	readonly dateId: string;
	readonly courseName: string;
	readonly kindLabel: string;
	readonly date: string;
	readonly timeStart: string;
	readonly signedUp: number;
	readonly slotsMax: number;
	readonly fillRatio: number;
	readonly nearFull: boolean;
	readonly waitingListCount: number;
};

export type UpcomingDateItem = {
	readonly courseId: string;
	readonly dateId: string;
	readonly title: string;
	readonly kindLabel: string;
	readonly date: string;
	readonly timeStart: string;
	readonly placeName: string | null;
	readonly signedUp: number;
	readonly slotsMax: number;
	readonly status: SessionStatus;
};

export type MonthlyRevenueItem = {
	readonly month: string;
	readonly netto: number;
	readonly brutto: number;
};

export type UpcomingHorizonDays = 7 | 30;

const WARSAW_TZ = 'Europe/Warsaw';

/** Calendar `YYYY-MM-DD` for `instant` in Europe/Warsaw. */
export const warsawYmd = (instant: Date = new Date()): string => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: WARSAW_TZ,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(instant);
	const y = parts.find((p) => p.type === 'year')?.value;
	const m = parts.find((p) => p.type === 'month')?.value;
	const d = parts.find((p) => p.type === 'day')?.value;
	if (!y || !m || !d) {
		throw new Error('Failed to format Warsaw calendar date');
	}
	return `${y}-${m}-${d}`;
};

/** Today as `YYYY-MM-DD` in Europe/Warsaw. */
export const warsawToday = (): string => warsawYmd(new Date());

/** Add calendar days to a `YYYY-MM-DD` string (UTC noon arithmetic — DST-safe). */
export const addCalendarDays = (ymd: string, days: number): string => {
	const [y, m, d] = ymd.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + days);
	const yy = dt.getUTCFullYear();
	const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(dt.getUTCDate()).padStart(2, '0');
	return `${yy}-${mm}-${dd}`;
};

/** Session status for ops UI. Cancelled wins over full. */
export const sessionStatus = (date: CourseClass): SessionStatus => {
	if (date.canceled === true) return 'cancelled';
	const signedUp = date.participants?.length ?? 0;
	if (signedUp >= date.slotsMax) return 'full';
	return 'open';
};

const effectiveNetto = (course: Course, date: CourseClass): number =>
	roundMoney(date.customPrice ?? course.price);

const signedUpCount = (date: CourseClass): number => date.participants?.length ?? 0;

export const buildSignupsSpotlight = (
	courses: readonly Course[],
	today: string = warsawToday()
): SignupsSpotlightItem[] => {
	const items: SignupsSpotlightItem[] = [];
	for (const course of courses) {
		const kindLabel = COURSE_KIND_LABEL[getCourseKind(course)];
		const waitingListCount = Math.max(0, course.waitingListCount ?? 0);
		for (const date of course.dates ?? []) {
			if (date.canceled === true) continue;
			if (date.date < today) continue;
			const signedUp = signedUpCount(date);
			const slotsMax = date.slotsMax > 0 ? date.slotsMax : 1;
			const fillRatio = signedUp / slotsMax;
			const left = getSlotsLeft(date);
			items.push({
				courseId: course.id,
				dateId: date.id,
				courseName: course.name,
				kindLabel,
				date: date.date,
				timeStart: date.timeStart,
				signedUp,
				slotsMax: date.slotsMax,
				fillRatio,
				nearFull: isLowSlotsLeft(left),
				waitingListCount,
			});
		}
	}
	return items.sort((a, b) => {
		if (b.fillRatio !== a.fillRatio) return b.fillRatio - a.fillRatio;
		if (b.signedUp !== a.signedUp) return b.signedUp - a.signedUp;
		return a.date.localeCompare(b.date) || a.courseName.localeCompare(b.courseName);
	});
};

export const buildUpcomingDates = (
	courses: readonly Course[],
	options: { readonly days: UpcomingHorizonDays; readonly today?: string }
): UpcomingDateItem[] => {
	const today = options.today ?? warsawToday();
	const until = addCalendarDays(today, options.days);
	const items: UpcomingDateItem[] = [];
	for (const course of courses) {
		const kindLabel = COURSE_KIND_LABEL[getCourseKind(course)];
		for (const date of course.dates ?? []) {
			if (date.date < today || date.date > until) continue;
			items.push({
				courseId: course.id,
				dateId: date.id,
				title: course.name,
				kindLabel,
				date: date.date,
				timeStart: date.timeStart,
				placeName: date.place?.name?.trim() || null,
				signedUp: signedUpCount(date),
				slotsMax: date.slotsMax,
				status: sessionStatus(date),
			});
		}
	}
	return items.sort(
		(a, b) =>
			a.date.localeCompare(b.date) ||
			a.timeStart.localeCompare(b.timeStart) ||
			a.title.localeCompare(b.title)
	);
};

const monthKeyFromYmd = (ymd: string): string => ymd.slice(0, 7);

const shiftMonth = (yearMonth: string, delta: number): string => {
	const [y, m] = yearMonth.split('-').map(Number);
	const idx = y * 12 + (m - 1) + delta;
	const ny = Math.floor(idx / 12);
	const nm = (idx % 12) + 1;
	return `${ny}-${String(nm).padStart(2, '0')}`;
};

/** Sum paid-participant netto into `YYYY-MM` buckets (session date). */
const accumulatePaidByMonth = (courses: readonly Course[]): Map<string, number> => {
	const buckets = new Map<string, number>();
	for (const course of courses) {
		for (const date of course.dates ?? []) {
			if (!date.date || date.date.length < 7) continue;
			const key = monthKeyFromYmd(date.date);
			const unit = effectiveNetto(course, date);
			for (const p of date.participants ?? []) {
				if (p.paid !== true) continue;
				buckets.set(key, roundMoney((buckets.get(key) ?? 0) + unit));
			}
		}
	}
	return buckets;
};

export type MonthlyRevenueOptions =
	| { readonly months: number; readonly today?: string }
	| { readonly year: number };

/**
 * Monthly revenue for last N months (inclusive of current) or a calendar year.
 * Always returns a dense series (zeros for empty months).
 */
export const buildMonthlyRevenue = (
	courses: readonly Course[],
	options: MonthlyRevenueOptions
): MonthlyRevenueItem[] => {
	const buckets = accumulatePaidByMonth(courses);

	if ('year' in options) {
		const { year } = options;
		const out: MonthlyRevenueItem[] = [];
		for (let m = 1; m <= 12; m++) {
			const month = `${year}-${String(m).padStart(2, '0')}`;
			const netto = buckets.get(month) ?? 0;
			out.push({ month, netto, brutto: bruttoFromNetto(netto) });
		}
		return out;
	}

	const today = options.today ?? warsawToday();
	const current = monthKeyFromYmd(today);
	const count = Math.max(1, Math.floor(options.months));
	const start = shiftMonth(current, -(count - 1));
	const out: MonthlyRevenueItem[] = [];
	let cursor = start;
	for (let i = 0; i < count; i++) {
		const netto = buckets.get(cursor) ?? 0;
		out.push({ month: cursor, netto, brutto: bruttoFromNetto(netto) });
		cursor = shiftMonth(cursor, 1);
	}
	return out;
};

/** Years that have any paid revenue (for year selector). */
export const revenueYearsPresent = (courses: readonly Course[]): number[] => {
	const years = new Set<number>();
	for (const course of courses) {
		for (const date of course.dates ?? []) {
			if (!date.date || date.date.length < 4) continue;
			const hasPaid = (date.participants ?? []).some((p) => p.paid === true);
			if (!hasPaid) continue;
			years.add(Number(date.date.slice(0, 4)));
		}
	}
	return [...years].sort((a, b) => b - a);
};

/** Ensure empty month rows still render for chart math. */
export const maxRevenueBrutto = (items: readonly MonthlyRevenueItem[]): number =>
	items.reduce((max, row) => Math.max(max, row.brutto), 0);

/** Polish short month label e.g. `paź 2025`. */
export const formatMonthLabelPl = (yearMonth: string): string => {
	const [y, m] = yearMonth.split('-').map(Number);
	const label = new Intl.DateTimeFormat('pl-PL', { month: 'short', year: 'numeric' }).format(
		new Date(Date.UTC(y, m - 1, 1))
	);
	return label.replace(/\s+/g, ' ').trim();
};
