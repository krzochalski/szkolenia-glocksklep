import { z } from 'zod';

export const dateEntrySchema = z.object({
	date: z.string().min(1, 'Data jest wymagana'),
	timeStart: z.string().min(1, 'Godzina jest wymagana'),
	slotsMax: z.coerce.number().min(1, 'Min. 1 miejsce'),
	_instructorId: z.string().min(1, 'Instruktor jest wymagany'),
	_placeId: z.string().min(1, 'Miejsce jest wymagane'),
	customPrice: z.coerce
		.number()
		.positive('Cena musi być większa od 0')
		.optional()
		.or(z.literal(0).transform(() => undefined))
		.or(z.literal('').transform(() => undefined)),
});

export type DateEntryValues = z.infer<typeof dateEntrySchema>;
