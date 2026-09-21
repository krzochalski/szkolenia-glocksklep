import type {
	DevelopmentPathDocument,
	DevelopmentPathLevel,
	DevelopmentPathStep,
	DevelopmentPathTrack,
} from '@/types/developmentPath';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';
import { db } from './firestore';

const COLLECTION = 'developmentPath';
const DOC_ID = 'content';

const step = (id: string, courseSlug: string): DevelopmentPathStep => ({ id, courseSlug });

const level = (id: string, items: DevelopmentPathStep[]): DevelopmentPathLevel => ({ id, items });

export const DEFAULT_DEVELOPMENT_PATH: DevelopmentPathDocument = {
	intro:
		'Zalecana kolejność szkoleń — od podstaw pistoletu do ruchu i soft skills zawodów.',
	paths: [
		{
			id: 'technical',
			title: 'Umiejętności techniczne',
			levels: [
				level('tech-l1', [step('tech-pbc', 'pistol-basic-course')]),
				level('tech-l2', [step('tech-tf', 'target-focus')]),
				level('tech-l3', [step('tech-mf', 'movement-fundamentals')]),
				level('tech-l4', [step('tech-mfe', 'movement-fundamentals-extended')]),
			],
		},
		{
			id: 'soft-skills',
			title: 'Soft skills',
			levels: [
				level('soft-l1', [step('soft-idpa', 'idpapiro-tips-and-tricks')]),
				level('soft-l2', [step('soft-ipsc', 'intro-to-ipsc')]),
			],
		},
	],
};

const normalizeStep = (raw: unknown): DevelopmentPathStep | null => {
	if (!raw || typeof raw !== 'object') return null;
	const s = raw as Record<string, unknown>;
	const courseSlug = typeof s.courseSlug === 'string' ? s.courseSlug.trim() : '';
	if (!courseSlug) return null;
	const id = typeof s.id === 'string' && s.id.trim() ? s.id.trim() : uuid();
	const label = typeof s.label === 'string' ? s.label.trim() : '';
	return label ? { id, courseSlug, label } : { id, courseSlug };
};

/** Accepts a level object, or a legacy flat step (courseSlug) wrapped as a one-item level. */
const normalizeLevel = (raw: unknown): DevelopmentPathLevel | null => {
	if (!raw || typeof raw !== 'object') return null;
	const entry = raw as Record<string, unknown>;

	if (Array.isArray(entry.items)) {
		const items = entry.items
			.map(normalizeStep)
			.filter((s): s is DevelopmentPathStep => s !== null);
		if (items.length === 0) return null;
		const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : uuid();
		return { id, items };
	}

	const single = normalizeStep(raw);
	if (!single) return null;
	return { id: uuid(), items: [single] };
};

const normalizeTrack = (raw: unknown): DevelopmentPathTrack | null => {
	if (!raw || typeof raw !== 'object') return null;
	const t = raw as Record<string, unknown>;
	const id = typeof t.id === 'string' ? t.id : '';
	const title = typeof t.title === 'string' ? t.title : '';
	if (!id || !title) return null;

	const levelsSource = Array.isArray(t.levels)
		? t.levels
		: Array.isArray(t.steps)
			? t.steps
			: [];
	const levels = levelsSource
		.map(normalizeLevel)
		.filter((l): l is DevelopmentPathLevel => l !== null);

	return { id, title, levels };
};

const normalizeDocument = (data: Record<string, unknown> | undefined): DevelopmentPathDocument => {
	const intro =
		typeof data?.intro === 'string' && data.intro.trim()
			? data.intro
			: DEFAULT_DEVELOPMENT_PATH.intro;
	const pathsRaw = Array.isArray(data?.paths) ? data.paths : [];
	const paths = pathsRaw
		.map(normalizeTrack)
		.filter((t): t is DevelopmentPathTrack => t !== null);
	return {
		intro,
		paths: paths.length > 0 ? paths : DEFAULT_DEVELOPMENT_PATH.paths,
		updatedAt:
			data?.updatedAt &&
			typeof (data.updatedAt as { toDate?: () => Date }).toDate === 'function'
				? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
				: undefined,
	};
};

export const getDevelopmentPath = async (): Promise<DevelopmentPathDocument> => {
	const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
	if (!snap.exists()) {
		return { ...DEFAULT_DEVELOPMENT_PATH };
	}
	return normalizeDocument(snap.data());
};

export const saveDevelopmentPath = async (
	docData: Pick<DevelopmentPathDocument, 'intro' | 'paths'>
): Promise<void> => {
	await setDoc(
		doc(db, COLLECTION, DOC_ID),
		{
			intro: docData.intro,
			paths: docData.paths,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
};

/** Seeds Firestore with default paths when document is missing. Admin only. */
export const seedDevelopmentPathIfMissing = async (): Promise<boolean> => {
	const ref = doc(db, COLLECTION, DOC_ID);
	const snap = await getDoc(ref);
	if (snap.exists()) return false;
	await setDoc(ref, {
		intro: DEFAULT_DEVELOPMENT_PATH.intro,
		paths: DEFAULT_DEVELOPMENT_PATH.paths,
		updatedAt: serverTimestamp(),
	});
	return true;
};
