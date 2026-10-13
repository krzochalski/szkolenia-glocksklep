export type CourseCompletion = {
	courseId: string;
	courseSlug: string;
	courseName: string;
	/** ISO timestamp or `YYYY-MM-DD` when the course was completed. */
	completedAt: string;
	/** Admin uid who wrote the record. */
	markedBy: string;
	/** ISO timestamp when the record was written. */
	markedAt: string;
};
