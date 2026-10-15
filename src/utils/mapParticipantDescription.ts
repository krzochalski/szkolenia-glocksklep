import type { CourseSchemaData } from '@/components/CourseLayout/CourseLayout.types';
import type { CourseDescription, CourseDescriptionSectionKey } from '@/types/courseDescription';
import { mapDescriptionToSchema } from '@/utils/mapCourseDescription';

/**
 * Maps CMS description to layout schema, keeping only sections enabled
 * for the participant panel (`visibleInParticipantPanel`).
 */
export const mapParticipantDescription = (
	desc: CourseDescription
): Pick<
	CourseSchemaData,
	| 'modules'
	| 'forWhom'
	| 'forWhomHeading'
	| 'notExpect'
	| 'notExpectHeading'
	| 'bring'
	| 'bringHeading'
	| 'dontBring'
	| 'dontBringHeading'
> => {
	const full = mapDescriptionToSchema(desc);
	const visible = new Set<CourseDescriptionSectionKey>(desc.visibleInParticipantPanel ?? []);

	return {
		modules: visible.has('modules') ? full.modules : undefined,
		forWhom: visible.has('forWhom') ? full.forWhom : undefined,
		forWhomHeading: visible.has('forWhom') ? full.forWhomHeading : undefined,
		notExpect: visible.has('notExpect') ? full.notExpect : undefined,
		notExpectHeading: visible.has('notExpect') ? full.notExpectHeading : undefined,
		bring: visible.has('bring') ? full.bring : undefined,
		bringHeading: visible.has('bring') ? full.bringHeading : undefined,
		dontBring: visible.has('dontBring') ? full.dontBring : undefined,
		dontBringHeading: visible.has('dontBring') ? full.dontBringHeading : undefined,
	};
};
