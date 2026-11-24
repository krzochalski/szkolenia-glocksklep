import { TRAINING_AREA_SERVED } from '@constants/organizer';
import type { Course } from '@/types/course';
import { itemDescription } from './meta';

const areaPhrase = (): string => {
	const [first, second] = TRAINING_AREA_SERVED;
	return `${first}, ${second} i okolice`;
};

const disciplinePhrase = (course: Course): string => {
	const tagText = course.tags.join(' ').toLowerCase();
	if (/ipsc|idpa|piro|practical|praktyczn/.test(tagText)) {
		return 'strzelectwo praktyczne (IPSC / IDPA)';
	}
	if (course.kind === 'practice') {
		return 'trening strzelecki';
	}
	return 'szkolenie strzeleckie';
};

/** Meta description for a course detail page — local keywords without stuffing. */
export const courseSeoDescription = (course: Course): string => {
	const core = itemDescription(course.description);
	const level =
		course.level === 'basic'
			? 'poziom podstawowy'
			: course.level === 'intermediate'
				? 'poziom średni'
				: 'poziom zaawansowany';
	const tail = `${disciplinePhrase(course)}, ${level}, ${areaPhrase()}. Zapisy online na najbliższe terminy.`;
	const combined = `${core} ${tail}`;
	return combined.length <= 160 ? combined : itemDescription(`${core} — ${tail}`);
};