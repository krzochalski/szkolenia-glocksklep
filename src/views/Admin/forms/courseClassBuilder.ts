import type { CourseClass, Instructor, Place } from '@/types/course';
import { defaultMinDecisionBy } from '@/utils/minParticipants';
import { z } from 'zod';

const ymd = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Format daty: YYYY-MM-DD');

const instructorSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	bio: z.string(),
	email: z.string().optional(),
});

const placeSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	googleMapsLink: z.string(),
	link: z.string().optional(),
});

/**
 * Persisted term shape shared by create + clone so the two paths cannot drift.
 * Omits canceled / runConfirmedDespiteMin / roster (those are per-term runtime state).
 */
export const courseClassWriteSchema = z.object({
	id: z.string().min(1),
	date: ymd,
	timeStart: z.string().min(1),
	slotsMax: z.number().int().min(1),
	minParticipants: z.number().int().min(1).optional(),
	minDecisionBy: ymd.optional(),
	subtitle: z.string().max(120).optional(),
	customPrice: z.number().positive().optional(),
	participants: z.array(z.record(z.string(), z.unknown())),
	instructor: instructorSchema,
	place: placeSchema,
});

export type CourseClassWrite = z.infer<typeof courseClassWriteSchema>;

export type BuildNewCourseClassInput = {
	readonly id: string;
	readonly date: string;
	readonly timeStart: string;
	readonly slotsMax: number;
	readonly minParticipants: number;
	readonly minDecisionBy: string;
	readonly instructor: Instructor;
	readonly place: Place;
	readonly subtitle?: string;
	readonly customPrice?: number;
};

const calendarDaysBetween = (fromYmd: string, toYmd: string): number => {
	const [fy, fm, fd] = fromYmd.split('-').map(Number);
	const [ty, tm, td] = toYmd.split('-').map(Number);
	const from = Date.UTC(fy, fm - 1, fd);
	const to = Date.UTC(ty, tm - 1, td);
	return Math.round((to - from) / 86_400_000);
};

/** Recompute decision deadline for a new session date, preserving the source gap when possible. */
export const recomputeMinDecisionBy = (
	source: Pick<CourseClass, 'date' | 'minDecisionBy'>,
	newDate: string,
	fallbackDaysBefore: number
): string | undefined => {
	const raw = source.minDecisionBy?.trim();
	if (raw && ymd.safeParse(raw).success && ymd.safeParse(source.date).success) {
		const gap = calendarDaysBetween(raw, source.date);
		return defaultMinDecisionBy(newDate, Math.max(0, gap));
	}
	if (Number.isFinite(fallbackDaysBefore) && fallbackDaysBefore >= 0) {
		return defaultMinDecisionBy(newDate, fallbackDaysBefore);
	}
	return undefined;
};

const toWriteShape = (value: CourseClassWrite): CourseClass => {
	const subtitle = value.subtitle?.trim();
	return {
		id: value.id,
		date: value.date,
		timeStart: value.timeStart,
		slotsMax: value.slotsMax,
		participants: [],
		instructor: value.instructor,
		place: {
			id: value.place.id,
			name: value.place.name,
			slug: value.place.slug,
			googleMapsLink: value.place.googleMapsLink,
			...(value.place.link ? { link: value.place.link } : {}),
		},
		...(typeof value.minParticipants === 'number'
			? { minParticipants: value.minParticipants }
			: {}),
		...(value.minDecisionBy ? { minDecisionBy: value.minDecisionBy } : {}),
		...(subtitle ? { subtitle } : {}),
		...(value.customPrice != null ? { customPrice: value.customPrice } : {}),
	};
};

/** Build a new term the same way as admin „Nowy termin”. */
export const buildNewCourseClass = (input: BuildNewCourseClassInput): CourseClass => {
	const placeMaps = (input.place.googleMapsLink ?? input.place.link ?? '').trim();
	const parsed = courseClassWriteSchema.parse({
		id: input.id,
		date: input.date,
		timeStart: input.timeStart,
		slotsMax: input.slotsMax,
		minParticipants: input.minParticipants,
		minDecisionBy: input.minDecisionBy,
		participants: [],
		instructor: {
			id: input.instructor.id,
			name: input.instructor.name,
			slug: input.instructor.slug,
			bio: input.instructor.bio,
			...(input.instructor.email ? { email: input.instructor.email } : {}),
		},
		place: {
			id: input.place.id,
			name: input.place.name,
			slug: input.place.slug,
			googleMapsLink: placeMaps,
			...(input.place.link ? { link: input.place.link } : {}),
		},
		...(input.subtitle?.trim() ? { subtitle: input.subtitle.trim() } : {}),
		...(input.customPrice != null && input.customPrice > 0
			? { customPrice: input.customPrice }
			: {}),
	});
	return toWriteShape(parsed);
};

