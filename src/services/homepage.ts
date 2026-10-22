import { HOMEPAGE_HERO_IMAGES, toHomepageHeroImage } from '@constants/homepageHeroImages';
import type {
	HomepageDocument,
	HomepageMissionPoint,
	HomepageWayOfWorking,
	HomepageWritable,
} from '@/types/homepage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';
import { db } from './firestore';

const COLLECTION = 'homepage';
const DOC_ID = 'content';

const DEFAULT_MISSION_POINTS: HomepageMissionPoint[] = [
	{
		id: 'small-groups',
		title: 'Małe grupy',
		body: 'Zajęcia odbywają się w małych grupach do 6 osób, aby każdy uczestnik otrzymał dostateczną ilość porad i sugestii poprawek.',
	},
	{
		id: 'reps',
		title: 'Powtórzenia na głośno',
		body: 'Wykonujemy sporą ilość powtórzeń „na głośno”, aby każdy miał szansę dostatecznie przećwiczyć nowe zagadnienia, a nie tylko dowiedzieć się o ich istnieniu.',
	},
	{
		id: 'practical',
		title: 'Wzorce praktyczne',
		body: 'Zajęcia są oparte o najnowsze wzorce stosowane w strzelectwie praktycznym. Techniki działające na wideo lub w wyobraźni zostały tutaj odfiltrowane.',
	},
];

const joinMissionBody = (points: HomepageMissionPoint[]): string =>
	points.map((p) => p.body).join('\n\n');

export const DEFAULT_HOMEPAGE: HomepageWritable = {
	heroHeadline: 'Trening, który buduje realną skuteczność',
	heroSubline:
		'Profesjonalne szkolenia strzeleckie — od podstaw pistoletu po dynamikę ruchu i soft skills zawodów.',
	heroImage: HOMEPAGE_HERO_IMAGES[0],
	missionTitle: 'Sposób pracy',
	missionPoints: DEFAULT_MISSION_POINTS,
	missionBody: joinMissionBody(DEFAULT_MISSION_POINTS),
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
		{
			id: 'debrief',
			title: 'Plan po ukończeniu',
			description:
				'Po oznaczeniu ukończenia szkolenia dostajesz plan zajęć oraz dodatkowe ćwiczenia i materiały w panelu uczestnika — możesz do nich wracać i ćwiczyć dalej.',
		},
		{
			id: 'materials-training',
			title: 'Treningi z materiałów kursu',
			description:
				'Absolwenci danego szkolenia mogą dołączać do treningów opartych o materiały z tego kursu — szybciej utrwalasz nawyki i przyspieszasz rozwój umiejętności.',
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

/** New default ways appended when an older CMS doc is missing them by id. */
const RETENTION_WAY_IDS = ['debrief', 'materials-training'] as const;

const DEFAULT_MISSION_POINT_IDS = DEFAULT_MISSION_POINTS.map((p) => p.id);

const normalizeWay = (raw: unknown): HomepageWayOfWorking | null => {
	if (!raw || typeof raw !== 'object') return null;
	const entry = raw as Record<string, unknown>;
	const title = typeof entry.title === 'string' ? entry.title.trim() : '';
	const description = typeof entry.description === 'string' ? entry.description.trim() : '';
	if (!title || !description) return null;
	const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : uuid();
	return { id, title, description };
};

const DEFAULT_MISSION_BY_ID = new Map(DEFAULT_MISSION_POINTS.map((p) => [p.id, p]));

const normalizeMissionPoint = (raw: unknown): HomepageMissionPoint | null => {
	if (!raw || typeof raw !== 'object') return null;
	const entry = raw as Record<string, unknown>;
	const body = typeof entry.body === 'string' ? entry.body.trim() : '';
	if (!body) return null;
	const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : uuid();
	const titleRaw = typeof entry.title === 'string' ? entry.title.trim() : '';
	const title = titleRaw || DEFAULT_MISSION_BY_ID.get(id)?.title || '';
	return { id, title, body };
};

const pointsFromMissionBody = (body: string): HomepageMissionPoint[] => {
	const parts = body
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean);
	if (parts.length === 0) return DEFAULT_MISSION_POINTS;
	return parts.map((text, index) => {
		const id = DEFAULT_MISSION_POINT_IDS[index] ?? `mission-${index + 1}`;
		return {
			id,
			title: DEFAULT_MISSION_BY_ID.get(id)?.title ?? '',
			body: text,
		};
	});
};

const resolveMissionPoints = (
	rawPoints: unknown,
	missionBody: string
): HomepageMissionPoint[] => {
	if (Array.isArray(rawPoints)) {
		const points = rawPoints
			.map(normalizeMissionPoint)
			.filter((p): p is HomepageMissionPoint => p !== null);
		if (points.length > 0) return points;
	}
	if (missionBody.trim()) return pointsFromMissionBody(missionBody);
	return DEFAULT_MISSION_POINTS;
};

const mergeWaysOfWorking = (ways: HomepageWayOfWorking[]): HomepageWayOfWorking[] => {
	if (ways.length === 0) return DEFAULT_HOMEPAGE.waysOfWorking;
	const ids = new Set(ways.map((w) => w.id));
	const extras = DEFAULT_HOMEPAGE.waysOfWorking.filter(
		(w) => (RETENTION_WAY_IDS as readonly string[]).includes(w.id) && !ids.has(w.id)
	);
	return extras.length > 0 ? [...ways, ...extras] : ways;
};

const normalizeDocument = (data: Record<string, unknown> | undefined): HomepageDocument => {
	const waysRaw = Array.isArray(data?.waysOfWorking) ? data.waysOfWorking : [];
	const ways = waysRaw
		.map(normalizeWay)
		.filter((w): w is HomepageWayOfWorking => w !== null);

	const heroImageRaw = typeof data?.heroImage === 'string' ? data.heroImage.trim() : '';
	const heroImage = toHomepageHeroImage(heroImageRaw) ?? DEFAULT_HOMEPAGE.heroImage;

	const missionBodyRaw =
		typeof data?.missionBody === 'string' ? data.missionBody.trim() : '';
	const missionPoints = resolveMissionPoints(data?.missionPoints, missionBodyRaw);

	return {
		heroHeadline: asString(data?.heroHeadline, DEFAULT_HOMEPAGE.heroHeadline),
		heroSubline: asString(data?.heroSubline, DEFAULT_HOMEPAGE.heroSubline),
		heroImage,
		missionTitle: asString(data?.missionTitle, DEFAULT_HOMEPAGE.missionTitle),
		missionPoints,
		missionBody: joinMissionBody(missionPoints),
		waysOfWorking: mergeWaysOfWorking(ways),
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
	const missionPoints = docData.missionPoints
		.map((p) => ({ id: p.id, title: p.title.trim(), body: p.body.trim() }))
		.filter((p) => p.body);
	await setDoc(
		doc(db, COLLECTION, DOC_ID),
		{
			...docData,
			missionPoints,
			missionBody: joinMissionBody(missionPoints),
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
