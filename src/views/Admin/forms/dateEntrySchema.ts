import { courseDateSubtitleSchema } from '@/utils/schemas';
import { z } from 'zod';

export const dateEntrySchema = z
	.object({
		date: z.string().min(1, 'Data jest wymagana'),
		timeStart: z.string().min(1, 'Godzina jest wymagana'),
		slotsMax: z.coerce.number().min(1, 'Min. 1 miejsce'),
		minParticipants: z.coerce.number().int().min(1, 'Min. 1 osoba'),
		minDecisionBy: z
			.string()
			.min(1, 'Termin decyzji jest wymagany')
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'Format daty: YYYY-MM-DD'),
		subtitle: courseDateSubtitleSchema,
		_instructorId: z.string().min(1, 'Instruktor jest wymagany'),
		_placeId: z.string().min(1, 'Miejsce jest wymagane'),
		customPrice: z.coerce
			.number()
			.positive('Cena musi być większa od 0')
			.optional()
			.or(z.literal(0).transform(() => undefined))
			.or(z.literal('').transform(() => undefined)),
	})
	.refine((d) => d.minParticipants <= d.slotsMax, {
		message: 'Minimum nie może przekraczać maks. miejsc',
		path: ['minParticipants'],
	})
	.refine((d) => d.minDecisionBy <= d.date, {
		message: 'Termin decyzji nie może być po dacie szkolenia',
		path: ['minDecisionBy'],
	});

export type DateEntryValues = z.infer<typeof dateEntrySchema>;
