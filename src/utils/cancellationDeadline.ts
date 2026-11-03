/** Shared cancellation / unenroll cutoff (SZ-2, SZ-7, SZ-8).
 * Canonical copy for the Next app (App Hosting ignores `functions/`).
 * Keep in sync with `functions/src/cancellationDeadline.ts` — see sync test.
 */
export const CANCELLATION_DEADLINE_HOURS_BEFORE = 96;

export const WARSAW_TZ = 'Europe/Warsaw';

export type UnenrollBlockReason = 'deadline_passed' | 'course_taken_place';

export type UnenrollEligibility =
	| { allowed: true }
	| { allowed: false; reason: UnenrollBlockReason };

type ZonedParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

const zonedParts = (instant: Date, timeZone: string): ZonedParts => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(instant);
	const get = (type: Intl.DateTimeFormatPartTypes): string =>
		parts.find((p) => p.type === type)?.value ?? '';
	return {
		year: Number(get('year')),
		month: Number(get('month')),
		day: Number(get('day')),
		hour: Number(get('hour')),
		minute: Number(get('minute')),
		second: Number(get('second')),
	};
};

const parseTimeHm = (timeHm: string): { hour: number; minute: number } => {
	const match = /^(\d{1,2}):(\d{2})$/.exec(timeHm.trim());
	if (!match) return { hour: 0, minute: 0 };
	const hour = Number(match[1]);
	const minute = Number(match[2]);
	if (
		!Number.isFinite(hour) ||
		!Number.isFinite(minute) ||
		hour < 0 ||
		hour > 23 ||
		minute < 0 ||
		minute > 59
	) {
		return { hour: 0, minute: 0 };
	}
	return { hour, minute };
};

const parseDateYmd = (dateYmd: string): { year: number; month: number; day: number } | null => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim());
	if (!match) return null;
	return {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3]),
	};
};

/**
 * Interpret `YYYY-MM-DD` + `HH:MM` as Europe/Warsaw wall time and return the UTC instant.
 * Invalid / missing time falls back to 00:00. Invalid date falls back to epoch.
 */
export const sessionStartUtc = (dateYmd: string, timeHm: string): Date => {
	const ymd = parseDateYmd(dateYmd);
	if (!ymd) return new Date(0);
	const { hour, minute } = parseTimeHm(timeHm);

	// Treat desired local as if UTC, then correct using the zone offset at that instant.
	let utcMs = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute, 0);
	for (let i = 0; i < 3; i++) {
		const local = zonedParts(new Date(utcMs), WARSAW_TZ);
		const wantedAsUtc = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute, 0);
		const gotAsUtc = Date.UTC(
			local.year,
			local.month - 1,
			local.day,
			local.hour,
			local.minute,
			local.second
		);
		const diff = wantedAsUtc - gotAsUtc;
		if (diff === 0) break;
		utcMs += diff;
	}
	return new Date(utcMs);
};

export const cancellationDeadlineUtc = (dateYmd: string, timeHm: string): Date =>
	new Date(
		sessionStartUtc(dateYmd, timeHm).getTime() - CANCELLATION_DEADLINE_HOURS_BEFORE * 60 * 60 * 1000
	);

export const getUnenrollEligibility = (input: {
	now: Date;
	date: string;
	timeStart: string;
	attendanceMarked: boolean;
}): UnenrollEligibility => {
	const start = sessionStartUtc(input.date, input.timeStart);
	const nowMs = input.now.getTime();
	if (input.attendanceMarked || nowMs >= start.getTime()) {
		return { allowed: false, reason: 'course_taken_place' };
	}
	const deadline = cancellationDeadlineUtc(input.date, input.timeStart);
	if (nowMs >= deadline.getTime()) {
		return { allowed: false, reason: 'deadline_passed' };
	}
	return { allowed: true };
};

export const unenrollBlockedMessage = (reason: UnenrollBlockReason): string => {
	if (reason === 'deadline_passed') {
		return `Termin na rezygnację minął (${CANCELLATION_DEADLINE_HOURS_BEFORE}h przed rozpoczęciem zajęć).`;
	}
	return 'To szkolenie już się odbyło.';
};
