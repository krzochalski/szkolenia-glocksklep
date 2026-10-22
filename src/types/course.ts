export interface Participant {
	/* Unique ID of the participant from firebase users */
	id: string;
	/* User name */
	name: string;
	/* Email of the participant */
	email: string;
	/* Phone number of the participant */
	phoneNumber?: string;
	/* Whether the participant has paid for the class */
	paid?: boolean;
	/* Whether the participant declares cash payment for the class */
	paysByCash?: boolean;
}

/** Catalog offer type: full course vs practice/training session. */
export type CourseKind = 'course' | 'practice';

export interface Course {
	id: string;
	/* Name of the class */
	name: string;
	/**
	 * Short focus line under the name (e.g. "IDPA", "dry-fire: reset z kabury").
	 * Optional on legacy docs; required in admin forms going forward.
	 */
	subtitle?: string;
	/* Name of the class in slug format */
	slug: string;
	/* Short description of the class */
	description: string;
	/* Price of the class in PLN, decimal */
	price: number;
	/* How many hours will the class last */
	hours: number;
	/**
	 * Default max participants for this course (card + new date defaults).
	 * Each date can still override via `dates[].slotsMax`.
	 */
	slotsMax?: number;
	/* Tags for this date */
	tags: string[];
	/* Level of proficiency for this date */
	level: 'basic' | 'intermediate' | 'advanced';
	/**
	 * Catalog kind. Legacy docs without `kind` are treated as `'course'`.
	 * `'practice'` = trening (may require completed prerequisite courses).
	 */
	kind?: CourseKind;
	/**
	 * When `kind === 'practice'`, user must have completed all listed course ids
	 * (`users/{uid}/courseCompletions/{id}`) to enroll or join the waitlist.
	 * Empty = open to everyone. Ignored for `kind === 'course'`.
	 */
	prerequisiteCourseIds?: string[];
	/** List-card thumbnail under `public/thumbnails/` (e.g. `/thumbnails/….webp`) */
	thumbnail?: string;
	/** Detail-page hero under `public/hero/` (e.g. `/hero/….webp`) */
	hero?: string;
	/**
	 * When true, course stays in admin but is hidden from public catalog
	 * and clients cannot enroll.
	 */
	inactive?: boolean;
	/** Display order in admin and public catalog (ascending). */
	order?: number;
	/**
	 * Public waitlist size for this course (denormalized; maintained by Cloud Functions).
	 * Used to show demand when there are no upcoming dates.
	 */
	waitingListCount?: number;
	dates?: CourseClass[];
}

export interface CourseClass {
	id: string;
	/* Maximum number of students of the class */
	slotsMax: number;
	/* Date in format YYYY-MM-DD */
	date: string;
	/* Time in format HH:MM */
	timeStart: string;
	/* Participants of the class */
	participants: Participant[];
	instructor: Instructor;
	place: Place;
	customPrice?: number;
	/* Whether the class has been canceled by admin */
	canceled?: boolean;
}

export interface Place {
	id: string;
	name: string;
	link?: string;
	googleMapsLink: string;
	slug: string;
}

export interface Tag {
	id: string;
	name: string;
	slug: string;
}

export interface Instructor {
	id: string;
	name: string;
	slug: string;
	bio: string;
	email?: string;
}
