import type { CourseClass } from '@/types/course';

export const withClonedDate = (
	dates: CourseClass[],
	sourceId: string,
	newId: string
): CourseClass[] => {
	const sourceIndex = dates.findIndex((d) => d.id === sourceId);
	if (sourceIndex < 0) return dates;
	const source = dates[sourceIndex];
	const cloned: CourseClass = {
		...source,
		id: newId,
		participants: [],
		canceled: undefined,
	};
	const next = [...dates];
	next.splice(sourceIndex + 1, 0, cloned);
	return next;
};
