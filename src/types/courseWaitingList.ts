export interface CourseWaitingListEntry {
	id: string;
	courseId: string;
	courseName: string;
	courseSlug: string;
	/** Present for signed-in users; omitted for guest email signups. */
	userId?: string;
	userName: string;
	email: string;
	phoneNumber?: string;
	/** True when the entry was created without an account. */
	guest?: boolean;
	createdAt: string;
	/** ISO timestamp when the user consented to waitlist emails. */
	consentAt: string;
	/**
	 * Last term id for which an automatic (or forced) new-date email was sent.
	 * Written only by Cloud Functions — clients must not set this on create.
	 */
	lastNotifiedTermId?: string;
}
