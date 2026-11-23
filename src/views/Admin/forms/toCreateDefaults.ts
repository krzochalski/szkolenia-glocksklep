import type { CourseClass } from '@/types/course';
import type { DateEntryValues } from './dateEntrySchema';

/**
 * Map a source term into create-form defaults.
 * Excludes per-term state: id, date, participants, canceled, runConfirmed, waitlistNotifiedAt.
 * Date stays empty so admin must confirm a new session day (avoids SZ-14 past-date clones).
 */
export const toCreateDefaults = (source: CourseClass): DateEntryValues => ({
	date: '',
	timeStart: source.timeStart,
	slotsMax: source.slotsMax,
	minParticipants: source.minParticipants ?? 1,
	minDecisionBy: '',
	subtitle: source.subtitle ?? '',
	_instructorId: source.instructor?.id ?? '',
	_placeId: source.place?.id ?? '',
	customPrice: source.customPrice,
});
