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
