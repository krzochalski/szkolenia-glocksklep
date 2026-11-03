export type DateMessageRecipientMode = 'confirmed' | 'waitlist' | 'manual';

export type DateMessageStatus =
	| 'queued'
	| 'sending'
	| 'sent'
	| 'partiallyFailed'
	| 'failed';

export type DateMessageRecipientStatus = 'pending' | 'sent' | 'failed';

/** `courses/{courseId}/dateMessages/{messageId}` */
export type DateMessage = {
	id: string;
	courseId: string;
	dateId: string;
	authorId: string;
	subject: string;
	bodyMarkdown: string;
	recipientMode: DateMessageRecipientMode;
	manualParticipantIds?: string[];
	status: DateMessageStatus;
	isTest: boolean;
	recipientCount: number;
	sentCount: number;
	failedCount: number;
	createdAt: string;
	sentAt?: string;
};

/** `…/dateMessages/{messageId}/recipients/{participantId}` */
export type DateMessageRecipient = {
	id: string;
	email: string;
	name?: string;
	renderedSubject: string;
	renderedHtml: string;
	renderedText: string;
	status: DateMessageRecipientStatus;
	error?: string;
	attempts: number;
	sentAt?: string;
};
