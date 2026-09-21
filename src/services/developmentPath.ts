import type {
	DevelopmentPathDocument,
	DevelopmentPathStep,
	DevelopmentPathTrack,
} from '@/types/developmentPath';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';
import { db } from './firestore';

const COLLECTION = 'developmentPath';
const DOC_ID = 'content';

export const DEFAULT_DEVELOPMENT_PATH: DevelopmentPathDocument = {
	intro:
		'Zalecana kolejność szkoleń — od podstaw pistoletu do ruchu i soft skills zawodów.',
	paths: [
		{
			id: 'technical',
			title: 'Umiejętności techniczne',
			steps: [
				{ id: 'tech-pbc', courseSlug: 'pistol-basic-course' },
				{ id: 'tech-tf', courseSlug: 'target-focus' },
				{ id: 'tech-mf', courseSlug: 'movement-fundamentals' },
				{ id: 'tech-mfe', courseSlug: 'movement-fundamentals-extended' },
			],
		},
		{
			id: 'soft-skills',
			title: 'Soft skills',
			steps: [
				{ id: 'soft-idpa', courseSlug: 'idpapiro-tips-and-tricks' },
				{ id: 'soft-ipsc', courseSlug: 'intro-to-ipsc' },
			],
		},
	],
};

const normalizeStep = (raw: unknown): DevelopmentPathStep | null => {
	if (!raw || typeof raw !== 'object') return null;
	const step = raw as Record<string, unknown>;
	const courseSlug = typeof step.courseSlug === 'string' ? step.courseSlug.trim() : '';
	if (!courseSlug) return null;
	const id = typeof step.id === 'string' && step.id.trim() ? step.id.trim() : uuid();
	const label = typeof step.label === 'string' ? step.label.trim() : '';
	return label ? { id, courseSlug, label } : { id, courseSlug };
};

const normalizeTrack = (raw: unknown): DevelopmentPathTrack | null => {
	if (!raw || typeof raw !== 'object') return null;
	const t = raw as Record<string, unknown>;
	const id = typeof t.id === 'string' ? t.id : '';
	const title = typeof t.title === 'string' ? t.title : '';
	if (!id || !title) return null;
	const stepsRaw = Array.isArray(t.steps) ? t.steps : [];
	const steps = stepsRaw
		.map(normalizeStep)
		.filter((s): s is DevelopmentPathStep => s !== null);
	return { id, title, steps };
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
