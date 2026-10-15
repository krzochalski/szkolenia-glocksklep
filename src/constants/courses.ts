export const COURSE_LEVEL_LABEL: Record<string, string> = {
	basic: 'Podstawowy',
	intermediate: 'Średniozaawansowany',
	advanced: 'Zaawansowany',
};

/** Ascending difficulty for list ordering. Unknown levels sort last. */
export const COURSE_LEVEL_ORDER: Record<string, number> = {
	basic: 0,
	intermediate: 1,
	advanced: 2,
};

/** Default start time when creating a new course date. */
export const DEFAULT_COURSE_TIME_START = '09:00';

/** Default max seats when creating a new course date. */
export const DEFAULT_COURSE_SLOTS_MAX = 12;
