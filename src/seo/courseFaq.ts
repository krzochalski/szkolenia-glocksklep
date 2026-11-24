import type { Course } from '@/types/course';
import type { FaqItem } from '@/types/faq';

export type CourseFaqEntry = { readonly title: string; readonly content: string };

const DEFAULT_BY_KIND: Record<'course' | 'practice', readonly CourseFaqEntry[]> = {
	course: [
		{
			title: 'Gdzie odbywają się zajęcia?',
			content:
				'Terminy prowadzimy na strzelnicach w Wielkopolsce — głównie w rejonie Poznania i okolic. Dokładny obiekt i dojazd widzisz przy każdym terminie na liście zapisów.',
		},
		{
			title: 'Czy to szkolenie pod zawody IPSC?',
			content:
				'Program budujemy pod strzelectwo praktyczne i bezpieczne nawyki. Jeśli trenujesz pod IPSC / IDPA, technika i suchy trening przekładają się bezpośrednio na wyniki na zawodach.',
		},
	],
	practice: [
		{
			title: 'Czym różni się trening od szkolenia?',
			content:
				'Trening zakłada, że masz już podstawy bezpieczeństwa i obsługi broni. Skupiamy się na powtarzalności, presji czasu i pracy na Twoim sprzęcie — nie na wykładzie od zera.',
		},
		{
			title: 'Czy muszę mieć ukończone wcześniejsze kursy?',
			content:
				'Przy zapisie system sprawdzi wymagane szkolenia wstępne. Jeśli czegoś brakuje, zobaczysz komunikat — wtedy wybierz wcześniejszy etap ze ścieżki rozwoju.',
		},
	],
};

const COURSE_FAQ_CATEGORIES = new Set(['rekrutacja', 'sprzet', 'bezpieczenstwo', 'logistyka']);

const toEntry = (item: FaqItem): CourseFaqEntry => ({
	title: item.question,
	content: item.answer,
});

const slugSpecific = (items: readonly FaqItem[], slug: string): CourseFaqEntry[] =>
	items
		.filter((item) => item.courseSlugs?.includes(slug))
		.sort((a, b) => a.order - b.order)
		.map(toEntry);

const globalForCourse = (items: readonly FaqItem[]): CourseFaqEntry[] =>
	items
		.filter((item) => !item.courseSlugs?.length && COURSE_FAQ_CATEGORIES.has(item.category ?? ''))
		.sort((a, b) => a.order - b.order)
		.slice(0, 4)
		.map(toEntry);

/** FAQ block for a course page — Firestore items + defaults, deduped by question. */
export const buildCourseFaqItems = (
	course: Course,
	firestoreItems: readonly FaqItem[]
): CourseFaqEntry[] => {
	const kind = course.kind ?? 'course';
	const defaults = DEFAULT_BY_KIND[kind];
	const merged = [...slugSpecific(firestoreItems, course.slug), ...globalForCourse(firestoreItems), ...defaults];
	const seen = new Set<string>();
	const out: CourseFaqEntry[] = [];
	for (const entry of merged) {
		const key = entry.title.trim().toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(entry);
		if (out.length >= 8) break;
	}
	return out;
};