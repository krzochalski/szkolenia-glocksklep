export interface CourseModuleData {
	icon: string;
	title: string;
	desc: string;
}

export interface CourseDescriptionSection {
	heading?: string;
	items: string[];
}

/** Structured gear / ammo requirements shown as a scannable strip. */
export interface CourseRequirements {
	/** Participant must bring their own firearm */
	ownGun: boolean;
	/** Participant must bring a holster */
	holster: boolean;
	/** Recommended round count (omit when not applicable) */
	roundCount?: number;
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
	| 'dontBring'
	| 'outcomes';

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
	/** List-card thumbnail under `public/thumbnails/` (e.g. `/thumbnails/….webp`) */
	thumbnail?: string;
	/** Detail-page hero under `public/hero/` (e.g. `/hero/….webp`) */
	hero?: string;
	/**
	 * @deprecated Prefer `thumbnail` / `hero`. Kept for existing Firestore docs.
	 */
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
	/** What you will be able to do afterwards */
	outcomes?: CourseDescriptionSection;
	/** Scannable requirements: own gun, holster, round count */
	requirements?: CourseRequirements;
	/** 2–3 session stills under `public/sessions/` */
	gallery?: string[];
	/** Optional YouTube URL of a real session clip */
	sessionVideoUrl?: string;
	/**
	 * Sections visible on the participant panel (SzkolenieSzczegoly).
	 * If undefined/empty, no sections are shown to participants.
	 */
	visibleInParticipantPanel?: CourseDescriptionSectionKey[];
}
