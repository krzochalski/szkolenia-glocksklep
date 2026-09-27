import type { ContactRequestFormat } from '@/types/contactRequest';

export const CONTACT_REQUEST_DEFAULT_MESSAGES: Record<ContactRequestFormat, string> = {
	individual: 'Chciałbym umówić zajęcia indywidualne.',
	group: 'Chciałbym umówić zajęcia dla grupy 4–6 osób.',
};

export const CONTACT_REQUEST_FORMAT_LABELS: Record<ContactRequestFormat, string> = {
	individual: 'Indywidualne',
	group: 'Grupa 4–6 osób',
};
