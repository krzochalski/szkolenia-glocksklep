import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	setDoc,
	where,
} from 'firebase/firestore';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import { auth } from './auth';
import { db } from './firestore';

const COLLECTION = 'courseWaitingList';

export const ALREADY_ON_WAITING_LIST = 'Jesteś już na liście oczekujących tego szkolenia.';
export const GUEST_ALREADY_ON_WAITING_LIST =
	'Ten adres e-mail jest już na liście oczekujących tego szkolenia.';

export const normalizeWaitingListEmail = (email: string): string => email.trim().toLowerCase();

export const getWaitingListEntryId = (courseId: string, userId: string): string =>
	`${courseId}_${userId}`;

export const getGuestWaitingListEntryId = (courseId: string, email: string): string =>
	`${courseId}_guest_${normalizeWaitingListEmail(email)}`;

export const addToWaitingList = async (params: {
	courseId: string;
	courseName: string;
	courseSlug: string;
	userId: string;
	userName: string;
	email: string;
	phoneNumber?: string;
}): Promise<'created' | 'exists'> => {
	const id = getWaitingListEntryId(params.courseId, params.userId);
	const ref = doc(db, COLLECTION, id);
	const existing = await getDoc(ref);
	if (existing.exists()) {
		return 'exists';
	}
	const email = normalizeWaitingListEmail(params.email);
	const now = new Date().toISOString();
	const phone = params.phoneNumber?.trim();
	const entry: Omit<CourseWaitingListEntry, 'id' | 'lastNotifiedTermId'> = {
		courseId: params.courseId,
		courseName: params.courseName,
		courseSlug: params.courseSlug,
		userId: params.userId,
		userName: params.userName,
		email,
		...(phone ? { phoneNumber: phone } : {}),
		createdAt: now,
		consentAt: now,
	};
	await setDoc(ref, entry);
	/* Confirmation email: Cloud Function onWaitingListCreated */
	return 'created';
};

/**
 * Unauthenticated waitlist signup by email only.
 * Idempotent upsert (no pre-read — guest get is not allowed by rules).
 */
export const addGuestToWaitingList = async (params: {
	courseId: string;
	courseName: string;
	courseSlug: string;
	email: string;
}): Promise<'created' | 'exists'> => {
	const email = normalizeWaitingListEmail(params.email);
	const id = getGuestWaitingListEntryId(params.courseId, email);
	const ref = doc(db, COLLECTION, id);
	const now = new Date().toISOString();
	const entry: Omit<
		CourseWaitingListEntry,
		'id' | 'userId' | 'phoneNumber' | 'lastNotifiedTermId'
	> = {
		courseId: params.courseId,
		courseName: params.courseName,
		courseSlug: params.courseSlug,
		userName: 'Gość',
		email,
		guest: true,
		createdAt: now,
		consentAt: now,
	};
	// Guests may create or update their own course+email doc; skip getDoc (denied unauthenticated).
	await setDoc(ref, entry);
	/* Confirmation email: Cloud Function onWaitingListCreated (create only) */
	return 'created';
};

export const removeFromWaitingList = async (courseId: string, userId: string): Promise<void> => {
	const id = getWaitingListEntryId(courseId, userId);
	const ref = doc(db, COLLECTION, id);
	const snap = await getDoc(ref);
	if (snap.exists()) {
		await deleteDoc(ref);
	}
};

export const isOnWaitingList = async (courseId: string, userId: string): Promise<boolean> => {
	const entry = await getWaitingListEntry(courseId, userId);
	return entry !== null;
};

export const getWaitingListEntry = async (
	courseId: string,
	userId: string
): Promise<CourseWaitingListEntry | null> => {
	const snap = await getDoc(doc(db, COLLECTION, getWaitingListEntryId(courseId, userId)));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() } as CourseWaitingListEntry;
};

export const getUserWaitingListEntries = async (
	userId: string
): Promise<CourseWaitingListEntry[]> => {
	const q = query(collection(db, COLLECTION), where('userId', '==', userId));
	const snap = await getDocs(q);
	return snap.docs
		.map((d) => ({ id: d.id, ...d.data() }) as CourseWaitingListEntry)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const adminGetWaitingListEntries = async (): Promise<CourseWaitingListEntry[]> => {
	const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseWaitingListEntry);
};

export const adminRemoveFromWaitingList = async (entryId: string): Promise<void> => {
	await deleteDoc(doc(db, COLLECTION, entryId));
};

export type AdminWaitlistNotifyScope = 'course' | 'all';

export type AdminWaitlistNotifyResult = {
	ok: true;
	sent: number;
	skipped: number;
	failed: number;
	recipientCount: number;
	skippedInvalid: number;
	courseIds: string[];
};

export const adminNotifyWaitingList = async (params: {
	scope: AdminWaitlistNotifyScope;
	courseId?: string;
	subject: string;
	body: string;
}): Promise<AdminWaitlistNotifyResult> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	const token = await user.getIdToken();
	const res = await fetch('/api/waitlist-notify', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			scope: params.scope,
			...(params.courseId ? { courseId: params.courseId } : {}),
			subject: params.subject,
			body: params.body,
		}),
	});
	const data = (await res.json().catch(() => ({}))) as {
		error?: string;
		ok?: boolean;
		sent?: number;
		skipped?: number;
		failed?: number;
		recipientCount?: number;
		skippedInvalid?: number;
		courseIds?: string[];
	};
	if (!res.ok) {
		throw new Error(data.error || 'Nie udało się wysłać e-maili.');
	}
	return {
		ok: true,
		sent: data.sent ?? 0,
		skipped: data.skipped ?? 0,
		failed: data.failed ?? 0,
		recipientCount: data.recipientCount ?? 0,
		skippedInvalid: data.skippedInvalid ?? 0,
		courseIds: data.courseIds ?? [],
	};
};

export type AdminWaitlistTermNotifyResult = {
	ok: true;
	sent: number;
	skipped: number;
	failed: number;
	recipientCount: number;
};

/** Admin: (re)send new-term waitlist emails for one date. */
export const adminNotifyWaitlistForTerm = async (params: {
	courseId: string;
	dateId: string;
	force?: boolean;
}): Promise<AdminWaitlistTermNotifyResult> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	const token = await user.getIdToken();
	const res = await fetch('/api/waitlist-term-notify', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			courseId: params.courseId,
			dateId: params.dateId,
			force: params.force ?? true,
		}),
	});
	const data = (await res.json().catch(() => ({}))) as {
		error?: string;
		sent?: number;
		skipped?: number;
		failed?: number;
		recipientCount?: number;
	};
	if (!res.ok) {
		throw new Error(data.error || 'Nie udało się wysłać powiadomień.');
	}
	return {
		ok: true,
		sent: data.sent ?? 0,
		skipped: data.skipped ?? 0,
		failed: data.failed ?? 0,
		recipientCount: data.recipientCount ?? 0,
	};
};
