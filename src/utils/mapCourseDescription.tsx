import type { CourseSchemaData } from '@/components/CourseLayout/CourseLayout.types';
import type { CourseDescription, CourseDescriptionSection } from '@/types/courseDescription';
import { getCourseIcon } from '@/utils/courseIcons';

const sectionToItems = (section?: CourseDescriptionSection): string[] | undefined => {
	if (!section || section.items.length === 0) return undefined;
	return section.items;
};

export const mapDescriptionToSchema = (desc: CourseDescription): CourseSchemaData => ({
	eyebrow: desc.eyebrow,
	headline: desc.headline,
	description: desc.description,
	slug: desc.slug,
	modules: desc.modules?.map((m) => ({
		icon: getCourseIcon(m.icon),
		title: m.title,
		desc: m.desc,
	})),
	forWhom: sectionToItems(desc.forWhom),
	notExpect: sectionToItems(desc.notExpect),
	bring: sectionToItems(desc.bring),
	dontBring: sectionToItems(desc.dontBring),
	forWhomHeading: desc.forWhom?.heading,
	notExpectHeading: desc.notExpect?.heading,
	bringHeading: desc.bring?.heading,
	dontBringHeading: desc.dontBring?.heading,
});
