'use client';

import { getMyCourseCompletions } from '@services/courseCompletions';
import { getCourses } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Course } from '@/types/course';
import {
	getPrerequisiteCourseIds,
	isEligibleForCourse,
	resolvePrerequisiteNames,
} from '@/utils/courseKind';
import { useAuthUser } from './useAuthUser';

type Eligibility = {
	readonly hasPrerequisites: boolean;
	readonly eligible: boolean;
	readonly loading: boolean;
	readonly prerequisiteNames: string[];
	readonly missingNames: string[];
};

/** Client-side eligibility for enroll/waitlist UX (server still enforces). */
export const useCourseEligibility = (course: Course): Eligibility => {
	const user = useAuthUser();
	const prereqs = getPrerequisiteCourseIds(course);
	const hasPrerequisites = prereqs.length > 0;

	const { data: completions = [], isLoading: completionsLoading } = useQuery({
		queryKey: ['myCourseCompletions'],
		queryFn: getMyCourseCompletions,
		enabled: Boolean(user) && hasPrerequisites,
	});

	const { data: catalog = [], isLoading: catalogLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
		enabled: hasPrerequisites,
	});

	return useMemo(() => {
		const prerequisiteNames = resolvePrerequisiteNames(course, catalog);
		if (!hasPrerequisites) {
			return {
				hasPrerequisites: false,
				eligible: true,
				loading: false,
				prerequisiteNames: [],
				missingNames: [],
			};
		}
		if (!user) {
			return {
				hasPrerequisites: true,
				eligible: false,
				loading: catalogLoading,
				prerequisiteNames,
				missingNames: prerequisiteNames,
			};
		}
		const completedIds = new Set(completions.map((c) => c.courseId));
		const eligible = isEligibleForCourse(course, completedIds);
		const missingNames = prereqs
			.filter((id) => !completedIds.has(id))
			.map((id) => catalog.find((c) => c.id === id)?.name ?? id);
		return {
			hasPrerequisites: true,
			eligible,
			loading: completionsLoading || catalogLoading,
			prerequisiteNames,
			missingNames,
		};
	}, [
		catalog,
		catalogLoading,
		completions,
		completionsLoading,
		course,
		hasPrerequisites,
		prereqs,
		user,
	]);
};
