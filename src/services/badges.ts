import type { AwardedBadge, Badge } from '@/types/badge';
import { stripUndefined } from '@/utils/common';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	orderBy,
	query,
	setDoc,
	updateDoc,
} from 'firebase/firestore';
import { auth } from './auth';
import { db } from './firestore';

const COL = 'badges';

const normalizeImage = (value: string): string => {
	const trimmed = value.trim();
	return trimmed ? toOptimizedImagePath(trimmed) : '';
};

const mapBadge = (id: string, data: Record<string, unknown>): Badge => ({
	id,
	name: typeof data.name === 'string' ? data.name : '',
	slug: typeof data.slug === 'string' ? data.slug : '',
	description: typeof data.description === 'string' ? data.description : undefined,
	image: typeof data.image === 'string' ? data.image : '',
});

export const getBadges = async (): Promise<Badge[]> => {
	const snap = await getDocs(query(collection(db, COL), orderBy('name')));
	return snap.docs.map((d) => mapBadge(d.id, d.data() as Record<string, unknown>));
};

export const createBadge = async (
	data: Omit<Badge, 'id'>
): Promise<void> => {
	await addDoc(
		collection(db, COL),
		stripUndefined({
			name: data.name.trim(),
			slug: data.slug.trim(),
			description: data.description?.trim() || undefined,
			image: normalizeImage(data.image),
		})
	);
};

export const updateBadge = async (id: string, data: Omit<Badge, 'id'>): Promise<void> => {
	await updateDoc(
		doc(db, COL, id),
		stripUndefined({
			name: data.name.trim(),
			slug: data.slug.trim(),
			description: data.description?.trim() || undefined,
			image: normalizeImage(data.image),
		})
	);
};

export const deleteBadge = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COL, id));
};

const awardsCol = (uid: string) => collection(db, 'users', uid, 'awardedBadges');

const mapAward = (id: string, data: Record<string, unknown>): AwardedBadge => ({
	badgeId: typeof data.badgeId === 'string' ? data.badgeId : id,
	badgeName: typeof data.badgeName === 'string' ? data.badgeName : '',
	badgeImage: typeof data.badgeImage === 'string' ? data.badgeImage : '',
	awardedAt: typeof data.awardedAt === 'string' ? data.awardedAt : '',
	markedBy: typeof data.markedBy === 'string' ? data.markedBy : '',
	markedAt: typeof data.markedAt === 'string' ? data.markedAt : '',
});

const sortByAwardedAt = (a: AwardedBadge, b: AwardedBadge) =>
	(b.awardedAt || b.markedAt).localeCompare(a.awardedAt || a.markedAt);

const listAwards = async (uid: string): Promise<AwardedBadge[]> => {
	const snap = await getDocs(awardsCol(uid));
	return snap.docs
		.map((d) => mapAward(d.id, d.data() as Record<string, unknown>))
		.sort(sortByAwardedAt);
};

export const getMyAwardedBadges = async (): Promise<AwardedBadge[]> => {
	const user = auth.currentUser;
	if (!user) return [];
	return listAwards(user.uid);
};

export const adminGetUserAwardedBadges = async (uid: string): Promise<AwardedBadge[]> =>
	listAwards(uid);

export const adminAwardBadge = async ({
	uid,
	badge,
	awardedAt,
}: {
	uid: string;
	badge: Pick<Badge, 'id' | 'name' | 'image'>;
	awardedAt?: string;
}): Promise<void> => {
	const admin = auth.currentUser;
	if (!admin) throw new Error('Brak zalogowanego użytkownika.');
	const now = new Date().toISOString();
	const awardedAtValue = awardedAt?.trim()
		? awardedAt.trim().includes('T')
			? awardedAt.trim()
			: `${awardedAt.trim()}T12:00:00.000Z`
		: now;
	const payload: AwardedBadge = {
		badgeId: badge.id,
		badgeName: badge.name,
		badgeImage: normalizeImage(badge.image),
		awardedAt: awardedAtValue,
		markedBy: admin.uid,
		markedAt: now,
	};
	await setDoc(doc(db, 'users', uid, 'awardedBadges', badge.id), payload);
};

export const adminRemoveAwardedBadge = async (uid: string, badgeId: string): Promise<void> => {
	await deleteDoc(doc(db, 'users', uid, 'awardedBadges', badgeId));
};
