import cors from 'cors';
import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { z, ZodError } from 'zod';

import { runBootstrap } from './bootstrap';
import {
	enrollBodySchema,
	enrollInCourseTx,
	unenrollBodySchema,
	unenrollFromCourseTx,
} from './enrollment';
import { sendEnrollmentConfirmation } from './enrollmentMail';
import { sendWaitingListConfirmation } from './waitingListMail';

initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '256kb' }));

const bearerUid = async (req: express.Request): Promise<string | null> => {
	const header = req.get('authorization') ?? '';
	const match = /^Bearer\s+(.+)$/i.exec(header);
	if (!match?.[1]) return null;
	try {
		const decoded = await getAuth().verifyIdToken(match[1]);
		return decoded.uid;
	} catch {
		return null;
	}
};

const isAdminUid = async (uid: string): Promise<boolean> => {
	const snap = await getFirestore().doc(`admins/${uid}`).get();
	return snap.exists;
};

const notifyEnrollmentBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	participant: z.object({
		name: z.string().min(1),
		email: z.string().email(),
	}),
});

app.post(['/api/enroll', '/enroll'], async (req, res) => {
	try {
		const uid = await bearerUid(req);
		if (!uid) {
			res.status(401).json({ error: 'Wymagane logowanie.' });
			return;
		}
		const body = enrollBodySchema.parse(req.body);
		await enrollInCourseTx(getFirestore(), uid, body);
		void sendEnrollmentConfirmation({
			db: getFirestore(),
			courseId: body.courseId,
			dateId: body.dateId,
			participant: body.participant,
		});
		res.status(200).json({ ok: true });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		const message = err instanceof Error ? err.message : 'Błąd zapisu.';
		res.status(400).json({ error: message });
	}
});

/** Admin-only: send enrollment confirmation after a client-side admin enroll. */
app.post(['/api/notify-enrollment', '/notify-enrollment'], async (req, res) => {
	try {
		const uid = await bearerUid(req);
		if (!uid) {
			res.status(401).json({ error: 'Wymagane logowanie.' });
			return;
		}
		if (!(await isAdminUid(uid))) {
			res.status(403).json({ error: 'Brak uprawnień.' });
			return;
		}
		const body = notifyEnrollmentBodySchema.parse(req.body);
		await sendEnrollmentConfirmation({
			db: getFirestore(),
			courseId: body.courseId,
			dateId: body.dateId,
			participant: body.participant,
		});
		res.status(200).json({ ok: true });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wysłać e-maila.' });
	}
});

app.post(['/api/unenroll', '/unenroll'], async (req, res) => {
	try {
		const uid = await bearerUid(req);
		if (!uid) {
			res.status(401).json({ error: 'Wymagane logowanie.' });
			return;
		}
		const body = unenrollBodySchema.parse(req.body);
		const admin = await isAdminUid(uid);
		await unenrollFromCourseTx(getFirestore(), uid, body, admin);
		res.status(200).json({ ok: true });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		const message = err instanceof Error ? err.message : 'Błąd wypisu.';
		res.status(400).json({ error: message });
	}
});

app.post(['/api/bootstrap', '/bootstrap'], async (req, res) => {
	try {
		const result = await runBootstrap(getFirestore(), req.body);
		res.status(200).json(result);
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Bootstrap failed' });
	}
});

app.post(['/api/dev/claim-admin', '/dev/claim-admin'], async (req, res) => {
	if (process.env.FUNCTIONS_EMULATOR !== 'true') {
		res.status(404).end();
		return;
	}
	const uid = await bearerUid(req);
	if (!uid) {
		res.status(401).json({ error: 'Wymagane logowanie.' });
		return;
	}
	const authUser = await getAuth().getUser(uid);
	await getFirestore()
		.doc(`admins/${uid}`)
		.set({ email: authUser.email ?? '', createdAt: new Date().toISOString() }, { merge: true });
	res.status(200).json({ ok: true });
});

export const api = onRequest(
	{
		region: 'europe-west1',
		memory: '512MiB',
		timeoutSeconds: 60,
	},
	app
);

export const onWaitingListCreated = onDocumentCreated(
	{
		document: 'courseWaitingList/{entryId}',
		region: 'europe-west1',
		memory: '256MiB',
		timeoutSeconds: 60,
	},
	async (event) => {
		const data = event.data?.data();
		if (!data) return;
		const email = typeof data.email === 'string' ? data.email : '';
		const courseName = typeof data.courseName === 'string' ? data.courseName : 'Szkolenie';
		const courseSlug = typeof data.courseSlug === 'string' ? data.courseSlug : '';
		if (!email || !courseSlug) return;
		await sendWaitingListConfirmation({
			courseName,
			courseSlug,
			recipientEmail: email,
		});
	}
);
