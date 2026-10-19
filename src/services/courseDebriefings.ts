import type { Course } from '@/types/course';
import type { CourseDebriefing } from '@/types/courseDebriefing';
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc,
} from 'firebase/firestore';
import { auth } from './auth';
import { getMyCourseCompletions } from './courseCompletions';
import { db } from './firestore';

const COLLECTION = 'courseDebriefings';

const timestampToIso = (value: unknown): string | undefined => {
	if (
		value &&
		typeof value === 'object' &&
		'toDate' in value &&
		typeof (value as { toDate: () => Date }).toDate === 'function'
	) {
		return (value as { toDate: () => Date }).toDate().toISOString();
	}
	return undefined;
};

const mapDoc = (id: string, data: Record<string, unknown>): CourseDebriefing => ({
	courseId: typeof data.courseId === 'string' ? data.courseId : id,
	courseSlug: typeof data.courseSlug === 'string' ? data.courseSlug : '',
	courseName: typeof data.courseName === 'string' ? data.courseName : '',
	content: typeof data.content === 'string' ? data.content : '',
	updatedAt: timestampToIso(data.updatedAt),
});

export const adminGetCourseDebriefings = async (): Promise<CourseDebriefing[]> => {
	const snap = await getDocs(collection(db, COLLECTION));
	return snap.docs
		.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
		.sort((a, b) => a.courseName.localeCompare(b.courseName, 'pl'));
};

export const getCourseDebriefing = async (
	courseId: string
): Promise<CourseDebriefing | null> => {
	const snap = await getDoc(doc(db, COLLECTION, courseId));
	if (!snap.exists()) return null;
	return mapDoc(snap.id, snap.data() as Record<string, unknown>);
};

/**
 * Loads debriefings for courses the signed-in user has completed.
 * Uses per-doc gets so Firestore rules (completion gate) stay satisfied.
 */
export const getMyCourseDebriefings = async (): Promise<CourseDebriefing[]> => {
	const user = auth.currentUser;
	if (!user) return [];
	const completions = await getMyCourseCompletions();
	const results = await Promise.all(
		completions.map(async (c) => {
			try {
				return await getCourseDebriefing(c.courseId);
			} catch {
				return null;
			}
		})
	);
	return results
		.filter((d): d is CourseDebriefing => Boolean(d?.content.trim()))
		.sort((a, b) => a.courseName.localeCompare(b.courseName, 'pl'));
};

export const saveCourseDebriefing = async ({
	course,
	content,
}: {
	course: Pick<Course, 'id' | 'slug' | 'name'>;
	content: string;
}): Promise<void> => {
	await setDoc(
		doc(db, COLLECTION, course.id),
		{
			courseId: course.id,
			courseSlug: course.slug,
			courseName: course.name,
			content,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
};

export const deleteCourseDebriefing = async (courseId: string): Promise<void> => {
	await deleteDoc(doc(db, COLLECTION, courseId));
};
