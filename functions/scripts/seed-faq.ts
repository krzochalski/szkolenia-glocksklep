/**
 * Replace FAQ collection with Szkolenia z Glockacci items.
 *
 * Usage (with ADC or GOOGLE_APPLICATION_CREDENTIALS):
 *   pnpm seed:faq
 *
 * Set REPLACE_ALL=0 to only add missing questions (skip delete).
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID =
	process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'szkolenia-glocksklep';
const REPLACE_ALL = process.env.REPLACE_ALL !== '0';

const FAQ_SEED_ITEMS = [
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
] as const;

if (getApps().length === 0) {
	initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();

const main = async () => {
	const col = db.collection('faq');
	if (REPLACE_ALL) {
		const existing = await col.get();
		const batch = db.batch();
		for (const doc of existing.docs) {
			batch.delete(doc.ref);
		}
		if (!existing.empty) {
			await batch.commit();
			console.log(`Deleted ${existing.size} existing FAQ docs.`);
		}
	}

	for (const item of FAQ_SEED_ITEMS) {
		if (!REPLACE_ALL) {
			const match = await col.where('question', '==', item.question).limit(1).get();
			if (!match.empty) {
				await match.docs[0].ref.set(item, { merge: true });
				console.log(`Updated: ${item.question}`);
				continue;
			}
		}
		const ref = await col.add({ ...item });
		console.log(`Created faq/${ref.id}: ${item.question}`);
	}

	console.log(`Done seeding FAQ into ${PROJECT_ID}.`);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
