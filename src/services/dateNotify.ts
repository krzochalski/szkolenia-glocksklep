import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import type { DateMessage, DateMessageRecipient } from '@/types/dateMessage';
import type { DateNotifyRecipientMode } from '@/utils/dateNotify';
import { auth } from './auth';
import { db } from './firestore';

export type AdminDateNotifyParams = {
	courseId: string;
	dateId: string;
	subject: string;
	bodyMarkdown: string;
	recipientMode: DateNotifyRecipientMode;
	manualParticipantIds?: string[];
	idempotencyKey: string;
	isTest?: boolean;
	retryFailedOfMessageId?: string;
};

export type AdminDateNotifyResult = {
	ok: true;
	messageId: string;
	sent: number;
	failed: number;
	skipped: number;
	skippedInvalid: number;
	skippedDuplicate: number;
	recipientCount: number;
	status: string;
	idempotentReplay?: boolean;
};

export const adminNotifyDateParticipants = async (
	params: AdminDateNotifyParams
): Promise<AdminDateNotifyResult> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	const token = await user.getIdToken();
	const res = await fetch('/api/date-notify', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			courseId: params.courseId,
			dateId: params.dateId,
			subject: params.subject,
			bodyMarkdown: params.bodyMarkdown,
			recipientMode: params.recipientMode,
			...(params.manualParticipantIds
				? { manualParticipantIds: params.manualParticipantIds }
				: {}),
			idempotencyKey: params.idempotencyKey,
			...(params.isTest ? { isTest: true } : {}),
			...(params.retryFailedOfMessageId
				? { retryFailedOfMessageId: params.retryFailedOfMessageId }
				: {}),
		}),
	});
	const data = (await res.json().catch(() => ({}))) as {
		error?: string;
		ok?: boolean;
		messageId?: string;
		sent?: number;
		failed?: number;
		skipped?: number;
		skippedInvalid?: number;
		skippedDuplicate?: number;
		recipientCount?: number;
		status?: string;
		idempotentReplay?: boolean;
	};
	if (!res.ok) {
		throw new Error(data.error || 'Nie udało się wysłać e-maili.');
	}
	return {
		ok: true,
		messageId: data.messageId ?? params.idempotencyKey,
		sent: data.sent ?? 0,
		failed: data.failed ?? 0,
		skipped: data.skipped ?? 0,
		skippedInvalid: data.skippedInvalid ?? 0,
		skippedDuplicate: data.skippedDuplicate ?? 0,
		recipientCount: data.recipientCount ?? 0,
		status: data.status ?? 'sent',
		idempotentReplay: data.idempotentReplay,
	};
};

export const listDateMessages = async (
	courseId: string,
	dateId: string
): Promise<DateMessage[]> => {
	const q = query(
		collection(db, 'courses', courseId, 'dateMessages'),
		where('dateId', '==', dateId),
		orderBy('createdAt', 'desc')
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => {
		const data = d.data();
		return {
			id: d.id,
			courseId: String(data.courseId ?? courseId),
			dateId: String(data.dateId ?? dateId),
			authorId: String(data.authorId ?? ''),
			subject: String(data.subject ?? ''),
			bodyMarkdown: String(data.bodyMarkdown ?? ''),
			recipientMode: data.recipientMode as DateMessage['recipientMode'],
			manualParticipantIds: Array.isArray(data.manualParticipantIds)
				? data.manualParticipantIds.filter((x): x is string => typeof x === 'string')
				: undefined,
			status: data.status as DateMessage['status'],
			isTest: data.isTest === true,
			recipientCount: typeof data.recipientCount === 'number' ? data.recipientCount : 0,
			sentCount: typeof data.sentCount === 'number' ? data.sentCount : 0,
			failedCount: typeof data.failedCount === 'number' ? data.failedCount : 0,
			createdAt: String(data.createdAt ?? ''),
			sentAt: typeof data.sentAt === 'string' ? data.sentAt : undefined,
		};
	});
};

export const listDateMessageRecipients = async (
	courseId: string,
	messageId: string
): Promise<DateMessageRecipient[]> => {
	const snap = await getDocs(
		collection(db, 'courses', courseId, 'dateMessages', messageId, 'recipients')
	);
	return snap.docs.map((d) => {
		const data = d.data();
		return {
			id: d.id,
			email: String(data.email ?? ''),
			name: typeof data.name === 'string' ? data.name : undefined,
			renderedSubject: String(data.renderedSubject ?? ''),
			renderedHtml: String(data.renderedHtml ?? ''),
			renderedText: String(data.renderedText ?? ''),
			status: data.status as DateMessageRecipient['status'],
			error: typeof data.error === 'string' ? data.error : undefined,
			attempts: typeof data.attempts === 'number' ? data.attempts : 0,
			sentAt: typeof data.sentAt === 'string' ? data.sentAt : undefined,
		};
	});
};
