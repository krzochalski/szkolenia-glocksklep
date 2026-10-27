type FaqSeedLink = { href: string; label: string };

type FaqSeedItem = {
	question: string;
	answer: string;
	order: number;
	category?: string;
	link?: FaqSeedLink;
	links?: FaqSeedLink[];
};

/** PLN with forced grouping (ICU pl-PL may omit groups below 10k). e.g. "1 000,00 zł". */
const pln = (amount: number): string => {
	const [intPart, frac = '00'] = amount.toFixed(2).split('.');
	const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
	return `${grouped},${frac}\u00a0zł`;
};

const PRICE_INDIVIDUAL = pln(1000);
const PRICE_PAIR_EXTRA = pln(350);
const PRICE_GROUP = pln(3000);

const MAILTO = 'mailto:zamowienia@glocksklep.pl';

/** Public FAQ copy — source of truth for `/faq` (sync via functions/scripts/sync-faq-from-seed.ts). */
export const FAQ_SEED_ITEMS: FaqSeedItem[] = [
	{
		question: 'Wymagania wstępne',
		answer: [
			'Potrzebujesz pozwolenia na broń oraz własnej broni. Materiał z zajęć trzeba potem przepracować we własnym zakresie — bez prywatnej broni to się nie składa.',
			'Jeśli masz legitymację służbową, firmowy Glock da się załatwić.',
			'To nie są piknikowe strzelania ani reguły typowej komercyjnej strzelnicy. Przychodzisz trenować, nie „postrzelać sobie”.',
		].join('\n\n'),
		order: 0,
		category: 'rekrutacja',
	},
	{
		question: 'Kiedy szkolenie ma sens?',
		answer: [
			'Dla osób, które chcą budować solidne nawyki od początku — albo szybko wyprostować to, co już poszło w złą stronę.',
			'Im wcześniej, tym lepiej: zanim złapiesz złe nawyki albo nasłuchasz się internetowych mitów o „bojowym” strzelaniu. Potem odkręcanie kosztuje więcej czasu i nerwów niż start na czysto.',
		].join('\n\n'),
		order: 1,
		category: 'rekrutacja',
	},
	{
		question: 'Jak się zapisać?',
		answer: [
			'1. Wybierz termin na stronie (najbliższe szkolenia albo karta konkretnego kursu).',
			'2. Załóż konto albo zaloguj się — wrócisz do tego samego terminu.',
			'3. Potwierdź zapis w oknie dialogowym. Płatności nie robisz w trakcie zapisu; po potwierdzeniu dostajesz proformę i dane do przelewu.',
		].join('\n\n'),
		order: 2,
		category: 'rekrutacja',
		links: [
			{ href: '/najblizsze-szkolenia', label: 'Najbliższe szkolenia' },
			{ href: '/register', label: 'Załóż konto' },
		],
	},
	{
		question: 'Co jeśli termin jest pełny?',
		answer: [
			'Dołącz do listy oczekujących danego szkolenia (poziom oferty, nie pojedynczy termin).',
			'Odezwiemy się, gdy zwolni się miejsce albo zbierzemy grupę. Lista nie gwarantuje miejsca i nie przydziela go automatycznie po wypisie kogoś innego.',
		].join('\n\n'),
		order: 3,
		category: 'rekrutacja',
		links: [{ href: '/najblizsze-szkolenia', label: 'Sprawdź terminy i listę oczekujących' }],
	},
	{
		question: 'Anulowanie i zwrot',
		answer: [
			'Rezygnacja w Serwisie (wypis) jest możliwa zawsze — skutki finansowe zależą od terminu:',
			'• co najmniej 3 dni przed datą Terminu — zwrot 100% wpłaconej kwoty;',
			'• później niż 3 dni przed — brak zwrotu;',
			'• gdy Organizator odwoła Termin (w tym z powodu braku minimum osób) — zwrot 100% albo, za Twoją zgodą, przeniesienie na inny Termin.',
			'Wypis w aplikacji nie uruchamia zwrotu automatycznie — napisz w sprawie zwrotu, podając dane zapisu. Szczegóły: Regulamin.',
		].join('\n\n'),
		order: 4,
		category: 'rekrutacja',
		links: [
			{ href: '/regulamin', label: 'Regulamin' },
			{ href: MAILTO, label: 'Napisz w sprawie zwrotu' },
		],
	},
	{
		question: 'Jak wygląda płatność?',
		answer: [
			'Po zapisie dostajesz proformę (w Moje szkolenia i zwykle też mailem) z kwotą i numerem konta.',
			'Płacisz przelewem bankowym. Gotówka — tylko jeśli wcześniej dogadamy i oznaczymy to w systemie. Nie ma bramki online (BLIK, karty, Przelewy24) w trakcie zapisu.',
			'Termin zapłaty wynika z proformy i wynosi zasadniczo do 5 dni przed datą Terminu. Status „opłacone” ustawia Organizator po wpływie.',
		].join('\n\n'),
		order: 5,
		category: 'rekrutacja',
		links: [{ href: '/profil/moje-szkolenia', label: 'Moje szkolenia / proforma' }],
	},
	{
		question: 'Gdzie są zajęcia i co zabrać?',
		answer: [
			'Miejsce zależy od typu zajęć i jest na karcie konkretnego terminu. Treningi bezstrzałowe (dry-fire) często robimy w Rankor Athletics. Zajęcia na ostro — na strzelnicy wskazanej przy terminie (np. Czacz, Tarcza Karchowo).',
			'Weź ze sobą: własną broń, magazynki, ochronę słuchu i oczu, wygodny strój i obuwie. Na dry-fire bez amunicji bojowej; na live-fire — amunicję według wymagań kursu (szczegóły na karcie szkolenia).',
		].join('\n\n'),
		order: 6,
		category: 'logistyka',
		links: [{ href: '/najblizsze-szkolenia', label: 'Terminy i lokalizacje' }],
	},
	{
		question: 'Od ilu osób startuje termin?',
		answer: [
			'Szkolenia otwarte startują zwykle przy minimum 4 osobach (konkretny próg jest przy terminie). Zapis poniżej minimum jest możliwy — nie blokujemy go w systemie.',
			'Jeśli do decyzji Organizatora nie zbierze się minimum, Termin może zostać odwołany. Wtedy zwrot 100% wpłaty albo przeniesienie na inny Termin — bez automatycznego odwołania przez aplikację.',
		].join('\n\n'),
		order: 7,
		category: 'rekrutacja',
	},
	{
		question: 'Kto może uczestniczyć?',
		answer:
			'Szkolenia i konto w Serwisie są dla osób pełnoletnich — ukończone 18 lat. Dodatkowo obowiązują wymagania sprzętowe i pozwolenie opisane wyżej oraz na karcie szkolenia.',
		order: 8,
		category: 'rekrutacja',
	},
	{
		question: 'Ile kosztują zajęcia dla grup?',
		answer: [
			`Zazwyczaj zamykamy się w ${PRICE_GROUP} za grupę 4–6 osób (cena orientacyjna, jak na stronie głównej — zależy mocno od lokalizacji). Zajęcia stricte strzeleckie mogą mieć do 6 osób; dynamika ruchu — max 4.`,
			'W cenie jest już strzelnica, tarcze i inne zasoby potrzebne do zajęć.',
			'Oferta prywatna / grupowa to jedna kwota orientacyjna — bez rozbicia netto/brutto na kafelku. Otwarte terminy kursów na stronie pokazują brutto (główna) i netto (VAT 23%).',
			'Jeśli nie macie pełnej ekipy — napiszcie, może kogoś dorzucę.',
		].join('\n\n'),
		order: 9,
		category: 'rekrutacja',
		links: [{ href: MAILTO, label: 'Napisz w sprawie grupy' }],
	},
	{
		question: 'Ile kosztują zajęcia indywidualne?',
		answer: [
			`1:1 z instruktorem: ${PRICE_INDIVIDUAL} (dopłata ${PRICE_PAIR_EXTRA} dla par). Cena orientacyjna jak na stronie głównej.`,
			'W cenie jest już strzelnica, tarcze i inne zasoby potrzebne do zajęć.',
			'To jedna kwota orientacyjna (bez rozbicia netto/brutto na ofercie prywatnej). Otwarte terminy kursów na stronie pokazują brutto i netto.',
		].join('\n\n'),
		order: 10,
		category: 'rekrutacja',
		links: [{ href: MAILTO, label: 'Napisz w sprawie 1:1' }],
	},
	{
		question: 'Po co ta ścieżka rozwoju?',
		answer: [
			'Żeby zbierać na dane zajęcia osoby o zbliżonym poziomie i uniknąć sytuacji, w których ktoś się nudzi albo jest jeszcze za wcześnie na materiał.',
			'Nie będę czarował: wielokrotnie widziałem jako kursant, jak ktoś zawyżył poziom doświadczenia i blokował przebieg zajęć brakiem umiejętności albo nie ogarniał reguł bezpieczeństwa. Nie wszystkie zajęcia muszą być inkluzywne — mogę sobie pozwolić na etykę w biznesie.',
		].join('\n\n'),
		order: 11,
		category: 'rekrutacja',
		links: [{ href: '/sciezka-rozwoju', label: 'Ścieżka rozwoju' }],
	},
	{
		question: 'Czuję, że nie potrzebuję zaczynać od początku.',
		answer:
			'Napisz — dogadamy się. Nie było jeszcze zajęć, na których którykolwiek z uczestników nie dowiedziałby się nowych rzeczy.',
		order: 12,
		category: 'rekrutacja',
		links: [{ href: MAILTO, label: 'Napisz do mnie' }],
	},
];
