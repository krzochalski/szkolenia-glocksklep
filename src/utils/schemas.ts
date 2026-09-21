import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().min(1, 'E-mail jest wymagany').email('Nieprawidłowy e-mail'),
	password: z.string().min(1, 'Hasło jest wymagane'),
});

export const registerSchema = z.object({
	fullName: z.string().min(2, 'Imię i nazwisko jest wymagane'),
	email: z.string().min(1, 'E-mail jest wymagany').email('Nieprawidłowy e-mail'),
	phone: z.string().min(9, 'Numer telefonu jest wymagany'),
	terms: z.boolean().refine((val) => val, { message: 'Musisz zaakceptować regulamin' }),
});

export const profileSchema = z.object({
	displayName: z.string().min(2, 'Imię i nazwisko jest wymagane'),
	phone: z.string().optional(),
	nip: z.string().optional(),
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Podaj obecne hasło'),
		newPassword: z
			.string()
			.min(8, 'Minimum 8 znaków')
			.regex(/[A-Z]/, 'Wymagana wielka litera')
			.regex(/\d/, 'Wymagana cyfra')
			.regex(/[^A-Za-z0-9]/, 'Wymagany znak specjalny'),
		confirmPassword: z.string().min(1, 'Powtórz hasło'),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: 'Hasła nie są identyczne',
		path: ['confirmPassword'],
	});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const courseSchema = z.object({
	name: z.string().min(2, 'Nazwa jest wymagana (min. 2 znaki)'),
	slug: z
		.string()
		.min(2, 'Slug jest wymagany')
		.regex(/^[a-z0-9-]+$/, 'Tylko małe litery, cyfry i myślniki'),
	description: z.string().min(10, 'Opis jest wymagany (min. 10 znaków)'),
	price: z.coerce.number({ error: 'Podaj cenę' }).positive('Cena musi być większa od 0'),
	hours: z.coerce
		.number({ error: 'Podaj czas trwania' })
		.positive('Liczba godzin musi być większa od 0'),
	level: z.enum(['basic', 'intermediate', 'advanced'], { error: 'Wybierz poziom' }),
	tags: z.array(z.string()).default([]),
	dates: z
		.array(
			z.object({
				slotsMax: z.coerce
					.number({ error: 'Podaj liczbę miejsc' })
					.int('Liczba miejsc musi być liczbą całkowitą')
					.positive('Liczba miejsc musi być większa od 0'),
				date: z.string().min(1, 'Data jest wymagana'),
				timeStart: z
					.string()
					.min(1, 'Godzina jest wymagana')
					.regex(/^\d{2}:\d{2}$/, 'Format godziny: HH:MM'),
				instructor: z.object({
					name: z.string().min(2, 'Imię instruktora jest wymagane'),
					slug: z
						.string()
						.min(1, 'Slug instruktora jest wymagany')
						.regex(/^[a-z0-9-]+$/, 'Tylko małe litery, cyfry i myślniki'),
				}),
				place: z.object({
					name: z.string().min(1, 'Nazwa miejsca jest wymagana'),
					link: z.string().url('Podaj prawidłowy link Google Maps').or(z.literal('')).optional(),
				}),
				customPrice: z.coerce
					.number()
					.positive('Cena musi być większa od 0')
					.optional()
					.or(z.literal(0).transform(() => undefined))
					.or(z.literal('').transform(() => undefined)),
			})
		)
		.default([]),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
