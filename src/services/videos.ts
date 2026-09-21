import type { CourseVideo } from '@/types/video';
import { addDoc, collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from './firestore';

/**
 * Fetch all videos for a specific course date.
 */
export const getVideosForDate = async (
	courseId: string,
	dateId: string
): Promise<CourseVideo[]> => {
	const q = query(
		collection(db, 'courses', courseId, 'videos'),
		where('dateId', '==', dateId),
		orderBy('createdAt', 'desc')
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseVideo);
};

/**
 * Add a YouTube video link for a specific course date.
 */
export const addVideoForDate = async (
	courseId: string,
	dateId: string,
	authorId: string,
	authorName: string,
	url: string
): Promise<CourseVideo> => {
	const data = {
		url,
		dateId,
		authorId,
		authorName,
		createdAt: Timestamp.now().toDate().toISOString(),
	};
	const ref = await addDoc(collection(db, 'courses', courseId, 'videos'), data);
	return { id: ref.id, ...data };
};
