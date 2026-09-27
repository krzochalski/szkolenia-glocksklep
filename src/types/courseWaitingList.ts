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
}
