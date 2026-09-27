import { HOMEPAGE_HERO_IMAGES, toHomepageHeroImage } from '@constants/homepageHeroImages';
import type { HomepageDocument, HomepageWayOfWorking, HomepageWritable } from '@/types/homepage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';
import { db } from './firestore';

const COLLECTION = 'homepage';
const DOC_ID = 'content';

export const DEFAULT_HOMEPAGE: HomepageWritable = {
	heroHeadline: 'Trening, który buduje realną skuteczność',
	heroSubline:
		'Profesjonalne szkolenia strzeleckie — od podstaw pistoletu po dynamikę ruchu i soft skills zawodów.',
	heroImage: HOMEPAGE_HERO_IMAGES[0],
	missionTitle: 'Misja',
	missionBody:
		'Uczymy strzelać tak, żebyście byli skuteczni pod presją — bez farmazonów, bez piknikowych strzelań. Praca na własnej broni, jasne standardy i kolejność rozwoju, która ma sens.',
	waysOfWorking: [
		{
			id: 'practice',
			title: 'Praktyka ponad teorię',
			description:
				'Ćwiczenia na strzelnicy, konkretne cele i feedback. Mniej gadania, więcej powtórzeń które zostają.',
		},
		{
			id: 'own-gun',
			title: 'Własna broń',
			description:
				'Trenujemy na Waszym sprzęcie. Wymagane jest pozwolenie na broń oraz własna broń.',
		},
		{
			id: 'path',
			title: 'Jasna ścieżka',
			description:
				'Od fundamentów do ruchu i soft skills — w kolejności, która buduje nawyki zamiast je psuć.',
		},
	],
	growthPathTeaser:
		'Zalecana kolejność szkoleń — od podstaw pistoletu do ruchu i soft skills zawodów.',
	privateIndividualTitle: 'Zajęcia indywidualne',
	privateIndividualBody:
		'1:1 z instruktorem. Cena 1000 zł (dopłata 350 zł dla par). W cenie strzelnica, tarcze i niezbędne zasoby.',
	privateGroupTitle: 'Grupy dedykowane 4–6 osób',
	privateGroupBody:
		'Zazwyczaj ok. 3000 zł za grupę 4–6 osób. Stricte strzeleckie — do 6 osób; dynamika ruchu — max 4. Jeśli nie macie pełnej ekipy — napiszcie, może kogoś dorzucimy.',
};

const asString = (value: unknown, fallback: string): string =>
	typeof value === 'string' && value.trim() ? value.trim() : fallback;

const normalizeWay = (raw: unknown): HomepageWayOfWorking | null => {
	if (!raw || typeof raw !== 'object') return null;
	const entry = raw as Record<string, unknown>;
	const title = typeof entry.title === 'string' ? entry.title.trim() : '';
	const description = typeof entry.description === 'string' ? entry.description.trim() : '';
	if (!title || !description) return null;
	const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : uuid();
	return { id, title, description };
};

const normalizeDocument = (data: Record<string, unknown> | undefined): HomepageDocument => {
	const waysRaw = Array.isArray(data?.waysOfWorking) ? data.waysOfWorking : [];
	const ways = waysRaw
		.map(normalizeWay)
		.filter((w): w is HomepageWayOfWorking => w !== null);

	const heroImageRaw = typeof data?.heroImage === 'string' ? data.heroImage.trim() : '';
	const heroImage = toHomepageHeroImage(heroImageRaw) ?? DEFAULT_HOMEPAGE.heroImage;

	return {
		heroHeadline: asString(data?.heroHeadline, DEFAULT_HOMEPAGE.heroHeadline),
		heroSubline: asString(data?.heroSubline, DEFAULT_HOMEPAGE.heroSubline),
		heroImage,
		missionTitle: asString(data?.missionTitle, DEFAULT_HOMEPAGE.missionTitle),
		missionBody: asString(data?.missionBody, DEFAULT_HOMEPAGE.missionBody),
		waysOfWorking: ways.length > 0 ? ways : DEFAULT_HOMEPAGE.waysOfWorking,
		growthPathTeaser: asString(data?.growthPathTeaser, DEFAULT_HOMEPAGE.growthPathTeaser),
		privateIndividualTitle: asString(
			data?.privateIndividualTitle,
			DEFAULT_HOMEPAGE.privateIndividualTitle
		),
		privateIndividualBody: asString(
			data?.privateIndividualBody,
			DEFAULT_HOMEPAGE.privateIndividualBody
		),
		privateGroupTitle: asString(data?.privateGroupTitle, DEFAULT_HOMEPAGE.privateGroupTitle),
		privateGroupBody: asString(data?.privateGroupBody, DEFAULT_HOMEPAGE.privateGroupBody),
		updatedAt:
			data?.updatedAt &&
			typeof (data.updatedAt as { toDate?: () => Date }).toDate === 'function'
				? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
				: undefined,
	};
};

export const getHomepage = async (): Promise<HomepageDocument> => {
	const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
	if (!snap.exists()) {
		return { ...DEFAULT_HOMEPAGE };
	}
	return normalizeDocument(snap.data());
};

export const saveHomepage = async (docData: HomepageWritable): Promise<void> => {
	await setDoc(
		doc(db, COLLECTION, DOC_ID),
		{
			...docData,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
};

/** Seeds Firestore with default homepage when document is missing. Admin only. */
export const seedHomepageIfMissing = async (): Promise<boolean> => {
	const ref = doc(db, COLLECTION, DOC_ID);
	const snap = await getDoc(ref);
	if (snap.exists()) return false;
	await setDoc(ref, {
		...DEFAULT_HOMEPAGE,
		updatedAt: serverTimestamp(),
	});
	return true;
};
