/**
 * Replace Firestore `faq` collection with FAQ_SEED_ITEMS.
 *
 * Usage:
 *   pnpm --dir functions exec tsx scripts/sync-faq-from-seed.ts
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { FAQ_SEED_ITEMS } from '../../src/data/faqSeed.ts';

const PROJECT_ID =
	process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'szkolenia-glocksklep';

if (getApps().length === 0) {
	initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();
const COLLECTION = 'faq';

const main = async () => {
	const existing = await db.collection(COLLECTION).get();
	const deleteBatch = db.batch();
	for (const doc of existing.docs) {
		deleteBatch.delete(doc.ref);
	}
	await deleteBatch.commit();
	console.log(`Deleted ${existing.size} existing FAQ doc(s).`);

	let written = 0;
	for (const item of FAQ_SEED_ITEMS) {
		const payload: Record<string, unknown> = {
			question: item.question,
			answer: item.answer,
			order: item.order,
			...(item.category ? { category: item.category } : {}),
			updatedAt: FieldValue.serverTimestamp(),
		};
		if (item.links && item.links.length > 0) {
			payload.links = item.links;
			payload.link = item.links[0];
		} else if (item.link) {
			payload.link = item.link;
		}
		await db.collection(COLLECTION).add(payload);
		written += 1;
		console.log(`  [${item.order}] ${item.question}`);
	}
	console.log(`Wrote ${written} FAQ item(s) to ${PROJECT_ID}/${COLLECTION}.`);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
