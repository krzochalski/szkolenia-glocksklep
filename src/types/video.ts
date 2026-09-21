export interface CourseVideo {
	id: string;
	/** YouTube video URL */
	url: string;
	/** ID of the course date this video belongs to */
	dateId: string;
	/** UID of the user who posted the video */
	authorId: string;
	/** Display name of the author */
	authorName: string;
	/** Timestamp when the video was posted (ISO string) */
	createdAt: string;
}
