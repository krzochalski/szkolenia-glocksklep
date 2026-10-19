import type { Firestore } from 'firebase-admin/firestore';

/** Recount waitlist entries for a course and store on `courses/{id}.waitingListCount`. */
export const syncCourseWaitingListCount = async (
	db: Firestore,
	courseId: string
): Promise<void> => {
	if (!courseId) return;
	const countSnap = await db
		.collection('courseWaitingList')
		.where('courseId', '==', courseId)
		.count()
		.get();
	const waitingListCount = countSnap.data().count;
	const courseRef = db.collection('courses').doc(courseId);
	const courseSnap = await courseRef.get();
	if (!courseSnap.exists) return;
	await courseRef.update({ waitingListCount });
};
