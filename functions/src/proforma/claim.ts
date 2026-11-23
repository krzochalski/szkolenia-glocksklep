import type { Firestore } from 'firebase-admin/firestore';

export type ParticipantProformaStatus = 'pending' | 'sent' | 'failed' | 'replaced';

export type ParticipantProformaState = {
	status: ParticipantProformaStatus;
	number: string;
	amountNet: number;
	amountGross: number;
	vatRate: number;
	dueDate: string;
	paymentTitle: string;
	sentAt?: string;
	error?: string;
	version?: number;
	priceChangeId?: string;
	replacedAt?: string;
};

export type ClaimResult =
	| { action: 'skip'; reason: string }
	| { action: 'resend'; state: ParticipantProformaState }
	| { action: 'create'; state: ParticipantProformaState };

type CourseDate = {
	id?: string;
	date?: string;
	participants?: Array<{
		id?: string;
		paysByCash?: boolean;
		proforma?: ParticipantProformaState;
	}>;
};

type CourseDoc = {
	dates?: CourseDate[];
};

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

/**
 * Idempotency guard for auto-proforma.
 * - skip if already pending (another worker) or skip reasons handled by caller
 * - resend if forceResend and status is sent (reuse snapshot)
 * - create if missing/failed (or forceResend on failed/missing)
 */
export const decideProformaClaim = (input: {
	existing?: ParticipantProformaState | null;
	forceResend: boolean;
	nextState: ParticipantProformaState;
}): ClaimResult => {
	const existing = input.existing;
	if (!input.forceResend) {
		if (existing?.status === 'sent') {
			return { action: 'skip', reason: 'already_sent' };
		}
		if (existing?.status === 'pending') {
			return { action: 'skip', reason: 'already_pending' };
		}
		return { action: 'create', state: { ...input.nextState, status: 'pending' } };
	}

	if (existing?.status === 'sent') {
		return { action: 'resend', state: existing };
	}

	const reusedNumber = existing?.number?.trim() || input.nextState.number;
	return {
		action: 'create',
		state: {
			...input.nextState,
			number: reusedNumber,
			status: 'pending',
			error: undefined,
			sentAt: undefined,
		},
	};
};

/** Write `proforma` onto the matching participant inside courses.dates (transaction). */
export const updateParticipantProforma = async (
	db: Firestore,
	params: {
		courseId: string;
		dateId: string;
		participantId: string;
		proforma: ParticipantProformaState;
	}
): Promise<void> => {
	const ref = db.collection('courses').doc(params.courseId);
	await db.runTransaction(async (tx) => {
		const snap = await tx.get(ref);
		if (!snap.exists) throw new Error('Kurs nie istnieje.');
		const course = snap.data() as CourseDoc;
		const dates = (course.dates ?? []).map((d) => {
			if (!matchDate(d, params.dateId)) return d;
			const participants = (d.participants ?? []).map((p) =>
				p.id === params.participantId ? { ...p, proforma: params.proforma } : p
			);
			return { ...d, participants };
		});
		tx.update(ref, { dates });
	});
};

/** Claim pending slot in a transaction; returns decision + prior state. */
export const claimProformaInTx = async (
	db: Firestore,
	params: {
		courseId: string;
		dateId: string;
		participantId: string;
		forceResend: boolean;
		nextState: ParticipantProformaState;
	}
): Promise<ClaimResult & { paysByCash?: boolean }> => {
	const ref = db.collection('courses').doc(params.courseId);
	return db.runTransaction(async (tx) => {
		const snap = await tx.get(ref);
		if (!snap.exists) return { action: 'skip', reason: 'course_missing' };
		const course = snap.data() as CourseDoc;
		const date = (course.dates ?? []).find((d) => matchDate(d, params.dateId));
		if (!date) return { action: 'skip', reason: 'date_missing' };
		const participant = (date.participants ?? []).find(
			(p) => p.id === params.participantId
		);
		if (!participant) return { action: 'skip', reason: 'participant_missing' };

		const decision = decideProformaClaim({
			existing: participant.proforma,
			forceResend: params.forceResend,
			nextState: params.nextState,
		});

		if (decision.action === 'create') {
			const dates = (course.dates ?? []).map((d) => {
				if (!matchDate(d, params.dateId)) return d;
				return {
					...d,
					participants: (d.participants ?? []).map((p) =>
						p.id === params.participantId
							? { ...p, proforma: decision.state }
							: p
					),
				};
			});
			tx.update(ref, { dates });
		}

		return { ...decision, paysByCash: participant.paysByCash };
	});
};
