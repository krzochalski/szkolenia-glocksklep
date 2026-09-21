/**
 * Copy places (obiekty) from rparmsacademy → szkolenia-glocksklep.
 * Upserts by slug; new docs keep the source document id so date embeddings can match later.
 *
 * Usage (with ADC or GOOGLE_APPLICATION_CREDENTIALS):
 *   pnpm seed:places-from-rp-arms
 */
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const TARGET_PROJECT =
	process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'szkolenia-glocksklep';
const SOURCE_PROJECT = process.env.SOURCE_FIRESTORE_PROJECT ?? 'rparmsacademy';

const getOrInitApp = (projectId: string, name: string): App => {
	const existing = getApps().find((a) => a.name === name);
	if (existing) return existing;
	return initializeApp({ projectId }, name);
};

const stripUndefined = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.filter((item) => item !== undefined).map((item) => stripUndefined(item));
	}
	if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.filter(([, v]) => v !== undefined)
				.map(([k, v]) => [k, stripUndefined(v)])
		);
	}
	return value;
};

const placePayload = (data: Record<string, unknown>) => {
	const maps = String(data.googleMapsLink ?? data.link ?? '');
	return {
		name: String(data.name ?? ''),
		slug: String(data.slug ?? ''),
		googleMapsLink: maps,
		...(maps ? { link: maps } : {}),
	};
};

const copyPlaces = async (sourceDb: Firestore, targetDb: Firestore) => {
	const snap = await sourceDb.collection('places').get();
	console.log(`Found ${snap.size} places in ${SOURCE_PROJECT}`);
	for (const sourceDoc of snap.docs) {
		const payload = placePayload(sourceDoc.data() as Record<string, unknown>);
		if (!payload.slug) {
			console.warn(`Skipping place ${sourceDoc.id}: missing slug`);
			continue;
		}
		const clean = stripUndefined(payload) as Record<string, unknown>;
		const existing = await targetDb.collection('places').where('slug', '==', payload.slug).limit(1).get();
		if (existing.empty) {
			await targetDb.collection('places').doc(sourceDoc.id).set(clean);
			console.log(`Created places/${sourceDoc.id} (${payload.slug})`);
			continue;
		}
		await existing.docs[0].ref.set(clean, { merge: true });
		console.log(`Updated places/${existing.docs[0].id} (${payload.slug})`);
	}
};

const main = async () => {
	const sourceApp = getOrInitApp(SOURCE_PROJECT, 'rp-arms-source');
	const targetApp = getOrInitApp(TARGET_PROJECT, 'szkolenia-target');
	await copyPlaces(getFirestore(sourceApp), getFirestore(targetApp));
	console.log(`Done copying places into ${TARGET_PROJECT}.`);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
