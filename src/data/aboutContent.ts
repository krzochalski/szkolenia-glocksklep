export type AboutAchievement = {
	readonly year: string;
	readonly title: string;
	readonly detail: string;
};

export const ABOUT_PHOTO_SRC = '/about/piotr-krzoska.webp';

export const ABOUT_CONTENT = {
	name: 'Piotr "Glockacci" Krzoska',
	tagline: 'Zawodnik IPSC / IDPA / PiRO · instruktor szkoleń strzeleckich',
	historia: [
		'Od 2022 roku aktywnie uczestniczę w zawodach strzelectwa praktycznego IPSC, IDPA i PiRO. Wcześniej uprawiałem 3Gun oraz jego taktyczną odmianę. Specjalizuję się w strzelaniu z pistoletu.',
		'Jeśli szukasz kogoś, od kogo złapiesz dobrą technikę na start — w Wielkopolsce prawdopodobnie lepiej nie trafisz. Uczę technik, które sam wykorzystuję na zawodach: zero bullshit, konkretny feedback, praca na Twojej broni.',
		'Każda modyfikacja i każdy nawyk, który przenoszę na szkolenia, jest wynikiem tysięcy wystrzelonych naboi na zawodach rangi ogólnopolskiej — nie tuningu „do gabloty”.',
	],
	values: [
		{
			title: 'Sprawdzone techniki',
			body: 'Zero bullshit policy. Uczę tego, czym sam wygrywam pod presją czasu.',
		},
		{
			title: 'Dynamika',
			body: 'Wiedza z zawodów przekłada się na realne osiągi na strzelnicy — nie na teorię z PowerPointa.',
		},
		{
			title: 'Pasja',
			body: 'Niezależnie od skali wyzwania, każde szkolenie traktuję jak trening dla siebie.',
		},
	],
	achievements: [
		{
			year: '2025',
			title: 'Mistrz Polski IDPA',
			detail: 'Enhanced Service Pistol Division',
		},
		{
			year: '2025',
			title: 'Mistrz Wielkopolski',
			detail: 'IPSC Standard',
		},
		{
			year: '2025',
			title: 'Zwycięzca Borowiec Cup',
			detail: 'IPSC Standard',
		},
		{
			year: '2024',
			title: 'Mistrz Dolnego Śląska IPSC',
			detail: 'Production Optics',
		},
		{
			year: '2024',
			title: 'V-ce Mistrz Wielkopolski IPSC',
			detail: 'Production Optics',
		},
		{
			year: '2024',
			title: 'Srebrny Medalista Dolnośląskiej Ligi IPSC',
			detail: 'Production Optics',
		},
		{
			year: '2024',
			title: 'Brązowy Medalista Mistrzostw Polski IDPA',
			detail: 'Carry Optics',
		},
		{
			year: '2023',
			title: 'Mistrz Polski PiRO',
			detail: 'Sport',
		},
		{
			year: '2023',
			title: 'Zwycięzca Pucharu Polski IDPA',
			detail: 'Carry Optics',
		},
		{
			year: '2023',
			title: 'V-ce Mistrz Polski IDPA',
			detail: 'Carry Optics',
		},
		{
			year: '2023',
			title: 'Srebrny Medalista Dolnośląskiej Ligi IPSC',
			detail: 'Production Optics',
		},
	] satisfies readonly AboutAchievement[],
	instagram: 'https://www.instagram.com/salvatoreglockacci/',
	youtube: 'https://www.youtube.com/@SalvatoreGlockacci',
	email: 'szkolenia@glocksklep.pl',
} as const;
