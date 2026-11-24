import cors from 'cors';
import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import {
	onDocumentCreated,
	onDocumentDeleted,
	onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { z, ZodError } from 'zod';

import { sendEmailSignInMail, sendPasswordResetMail } from './authMail';
import { runBootstrap } from './bootstrap';
import { deleteUserAccount, deleteUserBodySchema } from './deleteUser';
import {
	enrollBodySchema,
	enrollInCourseTx,
	unenrollBodySchema,
	unenrollFromCourseTx,
} from './enrollment';
import { sendCourseCompletionThankYou } from './courseCompletionMail';
import { sendEnrollmentConfirmation } from './enrollmentMail';
import {
	adjustParticipantPrice,
	adjustParticipantPriceBodySchema,
} from './proforma/adjustPrice';
import { sendEnrollmentProforma } from './proforma/send';
import { requestCatalogRevalidation } from './revalidateCatalog';
import { syncCourseWaitingListCount } from './waitingListCount';
import { sendWaitingListConfirmation } from './waitingListMail';
import { sendDateNotify, dateNotifyBodySchema } from './dateNotifyMail';
import { sendWaitlistNotify, waitlistNotifyBodySchema } from './waitlistNotifyMail';
import {
	autoNotifyWaitlistOnCourseUpdate,
	notifyWaitlistForTerm,
	waitlistTermNotifyBodySchema,
} from './waitlistTermNotify';
import {
	AdminAuthError,
	createReceiptForRegistration,
	FakturowniaApiError,
	FakturowniaConfigError,
	ReceiptIssuingConflictError,
	RegistrationNotFoundError,
	requireAdmin,
} from './invoicing/fakturownia';
import { sendRegistrationReceiptEmail } from './invoicing/receiptMail';
import {
	unsubscribeWaitlistByToken,
	waitlistUnsubscribeBodySchema,
} from './waitlistUnsubscribe';

initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '256kb' }));

const emailBodySchema = z.object({
	email: z.string().email(),
});

const bearerUid = async (req: express.Request): Promise<string | null> => {
	/** Prefer X-Firebase-Authorization when App Hosting proxies with a Google ID token in Authorization. */
	const header = req.get('x-firebase-authorization') ?? req.get('authorization') ?? '';
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
		id: z.string().min(1),
		name: z.string().min(1),
		email: z.string().email(),
	}),
});

const resendProformaBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	participantId: z.string().min(1),
});

const notifyCourseCompletionBodySchema = z.object({
	uid: z.string().min(1),
	courseId: z.string().min(1),
});

/** Public: password reset email with action URL on szkolenia.glocksklep.pl */
app.post(['/api/password-reset', '/password-reset'], async (req, res) => {
	try {
		const { email } = emailBodySchema.parse(req.body);
		const result = await sendPasswordResetMail(email);
		if (!result.ok) {
			res.status(503).json({ error: 'Nie udało się wysłać e-maila. Spróbuj później.' });
			return;
		}
		res.status(200).json({ ok: true });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowy adres e-mail.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wysłać e-maila.' });
	}
});

/** Public: email-link sign-in with action URL on szkolenia.glocksklep.pl */
app.post(['/api/email-sign-in-link', '/email-sign-in-link'], async (req, res) => {
	try {
		const { email } = emailBodySchema.parse(req.body);
		const result = await sendEmailSignInMail(email);
		if (!result.ok) {
			res.status(503).json({ error: 'Nie udało się wysłać e-maila. Spróbuj później.' });
			return;
		}
		res.status(200).json({ ok: true });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowy adres e-mail.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wysłać e-maila.' });
	}
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
		void requestCatalogRevalidation();
		void sendEnrollmentConfirmation({
			db: getFirestore(),
			courseId: body.courseId,
			dateId: body.dateId,
			participant: body.participant,
		});
		void sendEnrollmentProforma({
			db: getFirestore(),
			courseId: body.courseId,
			dateId: body.dateId,
			participantId: body.participant.id,
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

/** Admin-only: purge Next catalog ISR after client-side course/date writes. */
app.post(['/api/revalidate-catalog', '/revalidate-catalog'], async (req, res) => {
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
		const slug =
			typeof req.body?.slug === 'string' && req.body.slug.trim()
				? req.body.slug.trim()
				: undefined;
		await requestCatalogRevalidation({ slug });
		res.status(200).json({ ok: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Nie udało się odświeżyć cache.' });
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
		void sendEnrollmentProforma({
			db: getFirestore(),
			courseId: body.courseId,
			dateId: body.dateId,
			participantId: body.participant.id,
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

/** Admin-only: manual per-participant price change + updated proforma e-mail. */
app.post(
	['/api/adjust-participant-price', '/adjust-participant-price'],
	async (req, res) => {
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
			const body = adjustParticipantPriceBodySchema.parse(req.body);
			const result = await adjustParticipantPrice({
				db: getFirestore(),
				adminUid: uid,
				body,
			});
			if (!result.ok) {
				const status =
					result.code === 'paid_confirm_required'
						? 409
						: result.code === 'not_found'
							? 404
							: result.code === 'proforma_failed'
								? 502
								: 400;
				res.status(status).json({ error: result.error, code: result.code });
				return;
			}
			res.status(200).json(result);
		} catch (err) {
			if (err instanceof ZodError) {
				res.status(400).json({ error: 'Nieprawidłowe dane.', code: 'validation' });
				return;
			}
			console.error(err);
			res.status(500).json({ error: 'Nie udało się zmienić ceny.' });
		}
	}
);

/** Admin-only: resend (or retry) enrollment proforma PDF e-mail. */
app.post(['/api/resend-proforma', '/resend-proforma'], async (req, res) => {
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
		const body = resendProformaBodySchema.parse(req.body);
		const result = await sendEnrollmentProforma({
			db: getFirestore(),
			courseId: body.courseId,
			dateId: body.dateId,
			participantId: body.participantId,
			forceResend: true,
		});
		if (!result.ok) {
			res.status(502).json({
				error: 'Nie udało się wysłać proformy.',
				detail: result.error,
			});
			return;
		}
		if (result.status === 'skipped') {
			res.status(400).json({
				error: 'Proforma nie została wysłana (pominięta).',
				reason: result.reason,
			});
			return;
		}
		res.status(200).json({ ok: true, number: result.number });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wysłać proformy.' });
	}
});

/** Admin-only: thank-you email after marking a course completion. */
app.post(['/api/notify-course-completion', '/notify-course-completion'], async (req, res) => {
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
		const body = notifyCourseCompletionBodySchema.parse(req.body);
		await sendCourseCompletionThankYou({
			db: getFirestore(),
			auth: getAuth(),
			uid: body.uid,
			courseId: body.courseId,
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

/** Admin-only: compose + send email to class-date participants (or course waitlist). */
app.post(['/api/date-notify', '/date-notify'], async (req, res) => {
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
		const body = dateNotifyBodySchema.parse(req.body);
		const authUser = await getAuth().getUser(uid);
		const result = await sendDateNotify(
			getFirestore(),
			{ uid, email: authUser.email ?? null },
			body
		);
		if (!result.ok) {
			res.status(400).json({ error: result.error, code: result.code });
			return;
		}
		res.status(200).json(result);
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wysłać e-maili.' });
	}
});

/** Public: unsubscribe from course waitlist via signed email token. */
app.post(['/api/waitlist-unsubscribe', '/waitlist-unsubscribe'], async (req, res) => {
	try {
		const body = waitlistUnsubscribeBodySchema.parse(req.body);
		const result = await unsubscribeWaitlistByToken(getFirestore(), body.token);
		if (!result.ok) {
			res.status(400).json({ error: result.error });
			return;
		}
		res.status(200).json({ ok: true, removed: result.removed });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowy token.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wypisać z listy.' });
	}
});

/** Admin-only: (re)send new-term waitlist emails for one date. */
app.post(['/api/waitlist-term-notify', '/waitlist-term-notify'], async (req, res) => {
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
		const body = waitlistTermNotifyBodySchema.parse(req.body);
		const result = await notifyWaitlistForTerm(getFirestore(), {
			courseId: body.courseId,
			dateId: body.dateId,
			force: body.force ?? true,
		});
		if (!result.ok) {
			res.status(400).json({ error: result.error, code: result.code });
			return;
		}
		res.status(200).json(result);
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wysłać powiadomień.' });
	}
});

/** Admin-only: compose + send email to waitlist (one course or all). */
app.post(['/api/waitlist-notify', '/waitlist-notify'], async (req, res) => {
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
		const body = waitlistNotifyBodySchema.parse(req.body);
		const result = await sendWaitlistNotify(getFirestore(), body);
		if (!result.ok) {
			const status = result.code === 'too_many' ? 400 : 400;
			res.status(status).json({ error: result.error, code: result.code });
			return;
		}
		res.status(200).json(result);
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		console.error(err);
		res.status(500).json({ error: 'Nie udało się wysłać e-maili.' });
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
		void requestCatalogRevalidation();
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

/** Admin-only: delete Firebase Auth user + users/{uid} profile. */
app.post(['/api/delete-user', '/delete-user'], async (req, res) => {
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
		const body = deleteUserBodySchema.parse(req.body);
		await deleteUserAccount(getAuth(), getFirestore(), uid, body.uid);
		res.status(200).json({ ok: true });
	} catch (err) {
		if (err instanceof ZodError) {
			res.status(400).json({ error: 'Nieprawidłowe dane.' });
			return;
		}
		const message = err instanceof Error ? err.message : 'Błąd usuwania użytkownika.';
		console.error(err);
		res.status(400).json({ error: message });
	}
});

const fakturowniaReceiptBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	participantId: z.string().min(1),
	sendEmail: z.boolean().optional().default(true),
});

const fakturowniaReceiptResendBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	participantId: z.string().min(1),
});

/** Admin: create Fakturownia receipt (paragon) for a course registration; idempotent. */
app.post(
	[
		'/api/admin/registrations/fakturownia-receipt',
		'/admin/registrations/fakturownia-receipt',
	],
	async (req, res) => {
		res.set('Cache-Control', 'no-store');
		try {
			const db = getFirestore();
			await requireAdmin(req, getAuth(), db);
			const body = fakturowniaReceiptBodySchema.parse(req.body);
			const result = await createReceiptForRegistration(db, body);
			let emailResult: { sent: boolean; error?: string } | undefined;
			if (!result.alreadyExists && body.sendEmail) {
				const mail = await sendRegistrationReceiptEmail(db, body);
				emailResult = { sent: mail.sent, error: mail.error };
			}
			if (result.alreadyExists) {
				res.status(409).json({
					error: 'Paragon już istnieje w Fakturowni',
					receipt: result.receipt,
				});
				return;
			}
			res.status(201).json({ receipt: result.receipt, email: emailResult });
		} catch (err) {
			console.error(err);
			if (err instanceof ZodError) {
				res.status(400).json({ error: 'Nieprawidłowe dane.' });
				return;
			}
			if (
				err instanceof AdminAuthError ||
				err instanceof RegistrationNotFoundError ||
				err instanceof ReceiptIssuingConflictError ||
				err instanceof FakturowniaConfigError ||
				err instanceof FakturowniaApiError
			) {
				res.status(err.status).json({
					error: err.message,
					...('details' in err && err.details != null ? { details: err.details } : {}),
				});
				return;
			}
			res.status(500).json({ error: 'Nie udało się wystawić paragonu.' });
		}
	}
);

/** Admin: resend Fakturownia receipt e-mail for a registration (idempotent). */
app.post(
	[
		'/api/admin/registrations/fakturownia-receipt/resend-email',
		'/admin/registrations/fakturownia-receipt/resend-email',
	],
	async (req, res) => {
		res.set('Cache-Control', 'no-store');
		try {
			const db = getFirestore();
			await requireAdmin(req, getAuth(), db);
			const body = fakturowniaReceiptResendBodySchema.parse(req.body);
			const mail = await sendRegistrationReceiptEmail(db, body);
			if (!mail.receipt) {
				res.status(404).json({ error: 'Brak paragonu do wysłania.' });
				return;
			}
			res.status(200).json({
				receipt: mail.receipt,
				email: { sent: mail.sent, error: mail.error },
			});
		} catch (err) {
			console.error(err);
			if (err instanceof ZodError) {
				res.status(400).json({ error: 'Nieprawidłowe dane.' });
				return;
			}
			if (err instanceof AdminAuthError || err instanceof RegistrationNotFoundError) {
				res.status(err.status).json({ error: err.message });
				return;
			}
			res.status(500).json({ error: 'Nie udało się wysłać e-maila z paragonem.' });
		}
	}
);

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

/** HTTP API stays private (org blocks allUsers). App Hosting proxies via Google ID token. */
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
		const courseId = typeof data.courseId === 'string' ? data.courseId : '';
		const entryId = event.params.entryId;
		await Promise.all([
			courseId ? syncCourseWaitingListCount(getFirestore(), courseId) : Promise.resolve(),
			email && courseSlug && courseId && entryId
				? sendWaitingListConfirmation({
						courseName,
						courseSlug,
						recipientEmail: email,
						entryId,
						courseId,
					})
				: Promise.resolve(),
		]);
		void requestCatalogRevalidation(courseSlug ? { slug: courseSlug } : undefined);
	}
);

export const onCourseUpdatedWaitlistNotify = onDocumentUpdated(
	{
		document: 'courses/{courseId}',
		region: 'europe-west1',
		memory: '512MiB',
		timeoutSeconds: 60,
	},
	async (event) => {
		const before = event.data?.before.data();
		const after = event.data?.after.data();
		if (!after) return;
		const courseId = event.params.courseId;
		await autoNotifyWaitlistOnCourseUpdate(getFirestore(), {
			courseId,
			before: before as Parameters<typeof autoNotifyWaitlistOnCourseUpdate>[1]['before'],
			after: after as Parameters<typeof autoNotifyWaitlistOnCourseUpdate>[1]['after'],
		});
	}
);

export const onWaitingListDeleted = onDocumentDeleted(
	{
		document: 'courseWaitingList/{entryId}',
		region: 'europe-west1',
		memory: '256MiB',
		timeoutSeconds: 60,
	},
	async (event) => {
		const data = event.data?.data();
		const courseId = typeof data?.courseId === 'string' ? data.courseId : '';
		if (!courseId) return;
		await syncCourseWaitingListCount(getFirestore(), courseId);
		void requestCatalogRevalidation();
	}
);
