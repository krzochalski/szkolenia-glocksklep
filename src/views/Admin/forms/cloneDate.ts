import type { CourseClass } from '@/types/course';
import { buildClonedCourseClass } from './courseClassBuilder';

export type CloneDateOptions = {
	readonly newDate: string;
	readonly minDecisionDaysBefore?: number;
};

export const withClonedDate = (
	dates: CourseClass[],
	sourceId: string,
	newId: string,
	options: CloneDateOptions
): CourseClass[] => {
	const sourceIndex = dates.findIndex((d) => d.id === sourceId);
	if (sourceIndex < 0) return dates;
	const source = dates[sourceIndex];
	const cloned = buildClonedCourseClass(source, {
		newId,
		date: options.newDate,
		minDecisionDaysBefore: options.minDecisionDaysBefore,
	});
	const next = [...dates];
	next.splice(sourceIndex + 1, 0, cloned);
	return next;
};
