export type ContactRequestFormat = 'individual' | 'group';

export type ContactRequestStatus = 'new' | 'handled';

export type ContactRequest = {
	id: string;
	format: ContactRequestFormat;
	email: string;
	phone?: string;
	message: string;
	status: ContactRequestStatus;
	createdAt: string;
};

export type ContactRequestInput = {
	format: ContactRequestFormat;
	email: string;
	phone?: string;
	message: string;
};
