/** Server-owned proforma e-mail state (Cloud Functions Admin SDK only). */
export type ParticipantProformaStatus = 'pending' | 'sent' | 'failed' | 'replaced';

export type ParticipantProforma = {
	status: ParticipantProformaStatus;
	number: string;
	amountNet: number;
	amountGross: number;
	vatRate: number;
	dueDate: string;
	paymentTitle: string;
	sentAt?: string;
	error?: string;
	/** 1-based revision; v1 = enroll, later = price changes. */
	version?: number;
	/** Idempotency key of the price change that produced this proforma. */
	priceChangeId?: string;
	replacedAt?: string;
};

export type ManualPriceAdjustmentType = 'finalPrice' | 'percent' | 'fixed';

/** Customer-facing + audit snapshot of the last manual price change. */
export type ParticipantManualAdjustment = {
	type: ManualPriceAdjustmentType;
	value: number;
	/** Shown to the customer on proforma / e-mail. */
	reason: string;
	/** Internal admin note (not shown to customer). */
	note?: string;
	adjustedBy: string;
	adjustedAt: string;
};

/**
 * Price breakdown for a signup. `finalPrice` mirrors `customPrice`.
 * `automaticDiscount` reserved for future tag discounts (always 0 for now).
 */
export type ParticipantPriceSnapshot = {
	basePrice: number;
	automaticDiscount: number;
	manualAdjustment?: ParticipantManualAdjustment;
	discountTotal: number;
	finalPrice: number;
};

export type ParticipantPriceHistoryEntry = {
	id: string;
	oldFinalPrice: number;
	newFinalPrice: number;
	reason: string;
	adjustedBy: string;
	adjustedAt: string;
	type: ManualPriceAdjustmentType;
	value: number;
};

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
	/**
	 * Optional per-signup price override (PLN netto), same unit as course/date.
	 * Resolution: `customPrice ?? date.customPrice ?? course.price`.
	 * Kept in sync with `priceSnapshot.finalPrice` by `/api/adjust-participant-price`.
	 */
	customPrice?: number;
	/** Admin-only reason for the individual price (cleared with the price). */
	customPriceNote?: string;
	/** ISO timestamp of last set/clear of the individual price. */
	customPriceUpdatedAt?: string;
	/** Admin uid who last set/cleared the individual price. */
	customPriceUpdatedBy?: string;
	/** Structured price breakdown (Functions-owned on adjust). */
	priceSnapshot?: ParticipantPriceSnapshot;
	/** Cap ~20 newest entries (Functions). */
	priceHistory?: ParticipantPriceHistoryEntry[];
	/**
	 * Auto proforma e-mail state. Written only by Cloud Functions (Admin SDK).
	 * Clients must not forge these fields.
	 */
	proforma?: ParticipantProforma;
	/** Prior proforma revisions (replaced). Cap ~20. */
	proformaVersions?: ParticipantProforma[];
}

/** Catalog offer type: full course vs practice/training session. */
export type CourseKind = 'course' | 'practice';

export interface Course {
	id: string;
	/* Name of the class */
	name: string;
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
	/**
	 * Default minimum headcount to treat a date as ready to run (new date defaults).
	 * Each date can override via `dates[].minParticipants`. Counts every signup in
	 * `participants[]` (same as capacity) — unpaid seats still count.
	 */
	minParticipants?: number;
	/**
	 * Days before session `date` used to seed `dates[].minDecisionBy` for new dates.
	 * On/after that deadline, below-min upcoming dates escalate to needs_decision.
	 */
	minDecisionDaysBefore?: number;
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
	/**
	 * ISO timestamp of the last admin waitlist blast for this course
	 * (written by Cloud Functions `/api/waitlist-notify` only).
	 */
	waitingListLastEmailedAt?: string;
	dates?: CourseClass[];
}

export interface CourseClass {
	id: string;
	/* Maximum number of students of the class */
	slotsMax: number;
	/**
	 * Minimum headcount for this date to be treated as ready to run.
	 * Counts every signup in `participants[]` (same as capacity).
	 * Legacy docs without the field: resolve via course/kind defaults.
	 */
	minParticipants?: number;
	/**
	 * Calendar deadline `YYYY-MM-DD` (≤ session `date`) after which a below-min
	 * future date escalates to needs_decision in admin. Legacy: compute from
	 * course `minDecisionDaysBefore`.
	 */
	minDecisionBy?: string;
	/**
	 * Admin explicitly confirmed the date will run despite being below min.
	 * Clears at_risk / needs_decision until min is reached or cancel.
	 */
	runConfirmedDespiteMin?: boolean;
	/* Date in format YYYY-MM-DD */
	date: string;
	/* Time in format HH:MM */
	timeStart: string;
	/**
	 * Short focus line for this edition (e.g. "IDPA", "dry-fire: reset z kabury").
	 * Optional; shown on date listings and enrollment detail.
	 */
	subtitle?: string;
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
