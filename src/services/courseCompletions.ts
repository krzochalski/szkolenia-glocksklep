import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	setDoc,
} from 'firebase/firestore';
import type { Course } from '@/types/course';
import type { CourseCompletion } from '@/types/courseCompletion';
import { auth } from './auth';
import { db } from './firestore';

const completionsCol = (uid: string) =>
	collection(db, 'users', uid, 'courseCompletions');

const mapDoc = (id: string, data: Record<string, unknown>): CourseCompletion => ({
	courseId: typeof data.courseId === 'string' ? data.courseId : id,
	courseSlug: typeof data.courseSlug === 'string' ? data.courseSlug : '',
	courseName: typeof data.courseName === 'string' ? data.courseName : '',
	completedAt: typeof data.completedAt === 'string' ? data.completedAt : '',
	markedBy: typeof data.markedBy === 'string' ? data.markedBy : '',
	markedAt: typeof data.markedAt === 'string' ? data.markedAt : '',
});

const sortByCompletedAt = (a: CourseCompletion, b: CourseCompletion) =>
	(b.completedAt || b.markedAt).localeCompare(a.completedAt || a.markedAt);

const listCompletions = async (uid: string): Promise<CourseCompletion[]> => {
	const snap = await getDocs(completionsCol(uid));
	return snap.docs
		.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
		.sort(sortByCompletedAt);
};

export const getMyCourseCompletions = async (): Promise<CourseCompletion[]> => {
	const user = auth.currentUser;
	if (!user) return [];
	return listCompletions(user.uid);
};

export const adminGetUserCourseCompletions = async (
	uid: string
): Promise<CourseCompletion[]> => listCompletions(uid);

export const adminSetCourseCompletion = async ({
	uid,
	course,
	completedAt,
}: {
	uid: string;
	course: Pick<Course, 'id' | 'slug' | 'name'>;
	completedAt?: string;
}): Promise<void> => {
	const admin = auth.currentUser;
	if (!admin) throw new Error('Brak zalogowanego użytkownika.');
	const now = new Date().toISOString();
	const completedAtValue = completedAt?.trim()
		? completedAt.trim().includes('T')
			? completedAt.trim()
			: `${completedAt.trim()}T12:00:00.000Z`
		: now;
	const payload: CourseCompletion = {
		courseId: course.id,
		courseSlug: course.slug,
		courseName: course.name,
		completedAt: completedAtValue,
		markedBy: admin.uid,
		markedAt: now,
	};
	await setDoc(doc(db, 'users', uid, 'courseCompletions', course.id), payload);
};

export const adminRemoveCourseCompletion = async (
	uid: string,
	courseId: string
): Promise<void> => {
	await deleteDoc(doc(db, 'users', uid, 'courseCompletions', courseId));
};
