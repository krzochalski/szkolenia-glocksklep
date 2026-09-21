export interface CourseModuleData {
	icon: string;
	title: string;
	desc: string;
}

export interface CourseDescriptionSection {
	heading?: string;
	items: string[];
}

/**
 * Keys of sections that can be toggled visible/hidden
 * on the participant panel (SzkolenieSzczegoly).
 */
export type CourseDescriptionSectionKey =
	| 'modules'
	| 'forWhom'
	| 'notExpect'
	| 'bring'
	| 'dontBring';

export interface CourseDescription {
	id: string;
	/** Course slug — links description to a course */
	slug: string;
	/** Eyebrow label above the headline */
	eyebrow: string;
	/** Main headline split into two lines */
	headline: [string, string];
	/** Lead paragraph below the headline */
	description: string;
	/** Background image path */
	background?: string;
	/** Program modules grid */
	modules?: CourseModuleData[];
	/** Who should attend — with optional heading */
	forWhom?: CourseDescriptionSection;
	/** What will NOT be there — with optional heading */
	notExpect?: CourseDescriptionSection;
	/** What to bring — with optional heading */
	bring?: CourseDescriptionSection;
	/** What NOT to bring — with optional heading */
	dontBring?: CourseDescriptionSection;
	/**
	 * Sections visible on the participant panel (SzkolenieSzczegoly).
	 * If undefined/empty, no sections are shown to participants.
	 */
	visibleInParticipantPanel?: CourseDescriptionSectionKey[];
}
