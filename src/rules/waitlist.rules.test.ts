// @vitest-environment node
/**
 * Firestore rules emulator suite for courseWaitingList.
 * Run via: pnpm test:rules
 * Skipped automatically when FIRESTORE_EMULATOR_HOST is unset (pnpm verify).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
	type RulesTestContext,
	type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
	where,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PROJECT_ID = 'szkolenia-glocksklep-rules-test';
const RULES_PATH = resolve(__dirname, '../../firestore.rules');
const runEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const authPayload = (courseId: string, uid: string, extra: Record<string, unknown> = {}) => {
	const now = '2026-11-23T10:00:00.000Z';
	return {
		courseId,
		courseName: 'Trening Bezstrzałowy',
		courseSlug: 'trening-bezstrzalowy',
		userId: uid,
		userName: 'Ada',
		email: 'ada@example.com',
		createdAt: now,
		consentAt: now,
		...extra,
	};
};

const guestPayload = (courseId: string, email: string) => {
	const now = '2026-11-23T10:00:00.000Z';
	return {
		courseId,
		courseName: 'Trening Bezstrzałowy',
		courseSlug: 'trening-bezstrzalowy',
		userName: 'Gość',
		email,
		guest: true,
		createdAt: now,
		consentAt: now,
	};
};

describe.skipIf(!runEmulator)('courseWaitingList firestore rules (emulator)', () => {
	let testEnv: RulesTestEnvironment;

	beforeAll(async () => {
		testEnv = await initializeTestEnvironment({
			projectId: PROJECT_ID,
			firestore: {
				rules: readFileSync(RULES_PATH, 'utf8'),
			},
		});
	});

	afterAll(async () => {
		await testEnv?.cleanup();
	});

	beforeEach(async () => {
		await testEnv.clearFirestore();
	});

	it('owner can create/read/delete own entry (incl. Trening Bezstrzałowy / cloned-style id)', async () => {
		const courseId = 'clonedBezstrzalowyTermCourse';
		const uid = 'userAda';
		const entryId = `${courseId}_${uid}`;
		const db = testEnv.authenticatedContext(uid).firestore();

		await assertSucceeds(getDoc(doc(db, 'courseWaitingList', entryId)));
		await assertSucceeds(setDoc(doc(db, 'courseWaitingList', entryId), authPayload(courseId, uid)));
		const snap = await getDoc(doc(db, 'courseWaitingList', entryId));
		expect(snap.exists()).toBe(true);
		await assertSucceeds(deleteDoc(doc(db, 'courseWaitingList', entryId)));
	});

	it('cannot create entry for another uid', async () => {
		const courseId = 'c1';
		const db = testEnv.authenticatedContext('userAda').firestore();
		await assertFails(
			setDoc(
				doc(db, 'courseWaitingList', `${courseId}_otherUser`),
				authPayload(courseId, 'otherUser')
			)
		);
		await assertFails(
			setDoc(
				doc(db, 'courseWaitingList', `${courseId}_userAda`),
				authPayload(courseId, 'otherUser')
			)
		);
	});

	it('cannot read another users entry', async () => {
		const courseId = 'c1';
		const ownerId = 'owner1';
		const entryId = `${courseId}_${ownerId}`;
		await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
			await setDoc(
				doc(ctx.firestore(), 'courseWaitingList', entryId),
				authPayload(courseId, ownerId)
			);
		});
		const stranger = testEnv.authenticatedContext('stranger').firestore();
		await assertFails(getDoc(doc(stranger, 'courseWaitingList', entryId)));
	});

	it('rejects missing consentAt / invalid email / extra forbidden keys', async () => {
		const courseId = 'c1';
		const uid = 'userAda';
		const db = testEnv.authenticatedContext(uid).firestore();
		const base = authPayload(courseId, uid);
		const { consentAt: _c, ...noConsent } = base;
		await assertFails(setDoc(doc(db, 'courseWaitingList', `${courseId}_${uid}`), noConsent));
		await assertFails(
			setDoc(doc(db, 'courseWaitingList', `${courseId}_${uid}`), {
				...base,
				email: 'x',
			})
		);
		await assertFails(
			setDoc(doc(db, 'courseWaitingList', `${courseId}_${uid}`), {
				...base,
				lastNotifiedTermId: 'term1',
			})
		);
	});

	it('admin can list all entries', async () => {
		const adminUid = 'admin1';
		await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
			const fs = ctx.firestore();
			await setDoc(doc(fs, 'admins', adminUid), {});
			await setDoc(doc(fs, 'courseWaitingList', 'c1_userA'), authPayload('c1', 'userA'));
			await setDoc(doc(fs, 'courseWaitingList', 'c2_userB'), authPayload('c2', 'userB'));
		});
		const adminDb = testEnv.authenticatedContext(adminUid).firestore();
		const snap = await assertSucceeds(getDocs(collection(adminDb, 'courseWaitingList')));
		expect(snap.size).toBe(2);
	});

	it('user list is constrained to own userId', async () => {
		await testEnv.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
			const fs = ctx.firestore();
			await setDoc(doc(fs, 'courseWaitingList', 'c1_userAda'), authPayload('c1', 'userAda'));
			await setDoc(doc(fs, 'courseWaitingList', 'c1_other'), authPayload('c1', 'other'));
		});
		const db = testEnv.authenticatedContext('userAda').firestore();
		const own = await assertSucceeds(
			getDocs(query(collection(db, 'courseWaitingList'), where('userId', '==', 'userAda')))
		);
		expect(own.size).toBe(1);
		await assertFails(
			getDocs(query(collection(db, 'courseWaitingList'), where('userId', '==', 'other')))
		);
	});

	it('guest can create with deterministic id and upsert', async () => {
		const courseId = 'c1';
		const email = 'guest@example.com';
		const entryId = `${courseId}_guest_${email}`;
		const db = testEnv.unauthenticatedContext().firestore();
		await assertSucceeds(
			setDoc(doc(db, 'courseWaitingList', entryId), guestPayload(courseId, email))
		);
		await assertSucceeds(
			setDoc(doc(db, 'courseWaitingList', entryId), guestPayload(courseId, email))
		);
		await assertFails(getDoc(doc(db, 'courseWaitingList', entryId)));
	});
});
