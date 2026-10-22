import type { Course, CourseKind } from '@/types/course';

export const COURSE_KIND_LABEL: Record<CourseKind, string> = {
	course: 'Szkolenie',
	practice: 'Trening',
};

/** Proforma line title: „Szkolenie strzeleckie: …” / „Trening strzelecki: …”. */
export const COURSE_KIND_PROFORMA_PREFIX: Record<CourseKind, string> = {
	course: 'Szkolenie strzeleckie',
	practice: 'Trening strzelecki',
};

export const COURSE_KIND_OPTIONS = [
	{ value: 'course', label: COURSE_KIND_LABEL.course },
	{ value: 'practice', label: COURSE_KIND_LABEL.practice },
] as const;

/** Resolve kind with legacy default (`course` when missing). */
export const getCourseKind = (course: Pick<Course, 'kind'> | null | undefined): CourseKind =>
	course?.kind === 'practice' ? 'practice' : 'course';

/** Proforma / invoice line: „Szkolenie strzeleckie: Name” or „Trening strzelecki: Name”. */
export const formatProformaServiceName = (
	course: Pick<Course, 'kind' | 'name'> | null | undefined
): string => {
	const kind = getCourseKind(course);
	const name = course?.name?.trim() || '—';
	return `${COURSE_KIND_PROFORMA_PREFIX[kind]}: ${name}`;
};

export const getPrerequisiteCourseIds = (
	course: Pick<Course, 'kind' | 'prerequisiteCourseIds'> | null | undefined
): string[] => {
	if (getCourseKind(course) !== 'practice') return [];
	return course?.prerequisiteCourseIds?.filter(Boolean) ?? [];
};

/** True when prereqs are empty or every id is in `completedIds`. */
export const isEligibleForCourse = (
	course: Pick<Course, 'kind' | 'prerequisiteCourseIds'> | null | undefined,
	completedIds: ReadonlySet<string>
): boolean => {
	const prereqs = getPrerequisiteCourseIds(course);
	if (prereqs.length === 0) return true;
	return prereqs.every((id) => completedIds.has(id));
};

export const PREREQUISITE_ENROLL_ERROR = 'To szkolenie wymaga ukończenia wcześniejszego kursu.';

/** Resolve prerequisite course names from a catalog list (stable order of ids). */
export const resolvePrerequisiteNames = (
	course: Pick<Course, 'kind' | 'prerequisiteCourseIds'> | null | undefined,
	catalog: ReadonlyArray<Pick<Course, 'id' | 'name'>>
): string[] => {
	const prereqs = getPrerequisiteCourseIds(course);
	if (prereqs.length === 0) return [];
	const byId = new Map(catalog.map((c) => [c.id, c.name]));
	return prereqs.map((id) => byId.get(id) ?? id);
};
