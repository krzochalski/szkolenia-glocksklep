export type CourseDebriefing = {
	/** Same as the course document id (and `courseCompletions` doc id). */
	courseId: string;
	courseSlug: string;
	courseName: string;
	/** Markdown: class plan, drills, images, YouTube links. */
	content: string;
	updatedAt?: string;
};
