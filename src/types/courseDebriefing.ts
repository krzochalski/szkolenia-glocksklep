export type CourseDebriefing = {
	/** Same as the course document id (and `courseCompletions` doc id). */
	courseId: string;
	courseSlug: string;
	courseName: string;
	/** Markdown: class plan, drills, images, YouTube links. */
	content: string;
	/** Increments on every admin save (1 on first publish). */
	version: number;
	/** ISO timestamp of the latest save. */
	updatedAt?: string;
};
