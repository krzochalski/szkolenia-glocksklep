import type { CourseSchemaData } from '@/components/CourseLayout/CourseLayout.types';
import type {
	CourseDescription,
	CourseDescriptionSection,
	CourseRequirements,
} from '@/types/courseDescription';
import { getCourseIcon } from '@/utils/courseIcons';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';
import { extractYoutubeId } from '@/utils/youtube';

const sectionToItems = (section?: CourseDescriptionSection): string[] | undefined => {
	if (!section || section.items.length === 0) return undefined;
	return section.items;
};

const hasRequirements = (req?: CourseRequirements): req is CourseRequirements => {
	if (!req) return false;
	return req.ownGun || req.holster || (typeof req.roundCount === 'number' && req.roundCount > 0);
};

const normalizeGallery = (gallery?: string[]): string[] | undefined => {
	if (!gallery?.length) return undefined;
	const paths = gallery
		.map((src) => toOptimizedImagePath(src.trim()))
		.filter(Boolean)
		.slice(0, 3);
	return paths.length > 0 ? paths : undefined;
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
	outcomes: sectionToItems(desc.outcomes),
	forWhomHeading: desc.forWhom?.heading,
	notExpectHeading: desc.notExpect?.heading,
	bringHeading: desc.bring?.heading,
	dontBringHeading: desc.dontBring?.heading,
	outcomesHeading: desc.outcomes?.heading,
	requirements: hasRequirements(desc.requirements) ? desc.requirements : undefined,
	gallery: normalizeGallery(desc.gallery),
	sessionVideoUrl:
		desc.sessionVideoUrl && extractYoutubeId(desc.sessionVideoUrl)
			? desc.sessionVideoUrl.trim()
			: undefined,
});
