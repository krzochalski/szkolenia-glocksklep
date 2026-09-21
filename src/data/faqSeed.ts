import type { FaqItem } from '@/types/faq';

/** Public FAQ copy for Szkolenia z Glockacci (from site screenshot). */
export const FAQ_SEED_ITEMS: Omit<FaqItem, 'id'>[] = [
	{
		question: 'Ile kosztują zajęcia indywidualne?',
		answer:
			'Cena wynosi 1000zł z dopłatą 350zł dla par. W cenie jest już strzelnica, tarcze i inne zasoby niezbędne do przeprowadzenia zajęć.',
		order: 0,
		category: 'rekrutacja',
	},
	{
		question: 'Ile kosztują zajęcia dla grup?',
		answer:
			'Zazwyczaj zamykamy się w 3000 za grupę 4-6 osób. Zajęcia stricte strzeleckie mogą mieć 6 osób, zajęcia z dynamiki ruchu to max 4 osoby. W cenie jest już strzelnica, tarcze i inne zasoby niezbędne do przeprowadzenia zajęć. Jeśli nie masz pełnej ekipy to zapraszam do kontaktu, może Wam kogoś znajdę.',
		order: 1,
		category: 'rekrutacja',
	},
	{
		question: 'Czy organizujesz jeszcze otwarte zajęcia?',
		answer:
			'Aktualnie nie. Większość moich terminów jest zarezerwowana na grup z którymi współpracuję oraz dla klientów indywidualnych.',
		order: 2,
		category: 'rekrutacja',
	},
	{
		question: 'Czy muszę mieć własną broń?',
		answer:
			'Definitywnie. Jeśli masz legitymację służbową to firmowy Glock się dla Ciebie znajdzie. Nie organizuję też piknikowych strzelań, ani nie daję postrzelać na regułach typowych dla komercyjnych strzelnic.',
		order: 3,
		category: 'sprzet',
	},
	{
		question: 'Jakie są wymagania wstępne?',
		answer: 'Wymagane jest posiadanie pozwolenia na broń oraz własnej broni.',
		order: 4,
		category: 'rekrutacja',
	},
	{
		question: 'Kiedy szkolenie ma sens?',
		answer:
			'Im szybciej, tym lepiej zanim złapiesz złe nawyki albo nasłuchasz się bojowych farmazonów.',
		order: 5,
		category: 'rekrutacja',
	},
];
