export interface CourseWaitingListEntry {
	id: string;
	courseId: string;
	courseName: string;
	courseSlug: string;
	userId: string;
	userName: string;
	email: string;
	phoneNumber?: string;
	createdAt: string;
}
