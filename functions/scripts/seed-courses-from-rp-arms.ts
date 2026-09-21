/**
 * Copy courses + courseDescriptions from rparmsacademy → szkolenia-glocksklep.
 * Courses are copied without dates (empty dates array).
 *
 * Usage (with ADC or GOOGLE_APPLICATION_CREDENTIALS):
 *   pnpm seed:courses-from-rp-arms
 */
import { initializeApp, getApps, type App } from 'firebase-admin/app';
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

const upsertBySlug = async (
	db: Firestore,
	collectionName: string,
	slug: string,
	payload: Record<string, unknown>
) => {
	const existing = await db.collection(collectionName).where('slug', '==', slug).limit(1).get();
	const clean = stripUndefined(payload) as Record<string, unknown>;
	if (existing.empty) {
		const ref = await db.collection(collectionName).add(clean);
		console.log(`Created ${collectionName}/${ref.id} (${slug})`);
		return;
	}
	await existing.docs[0].ref.set(clean, { merge: true });
	console.log(`Updated ${collectionName}/${existing.docs[0].id} (${slug})`);
};

const copyCourses = async (sourceDb: Firestore, targetDb: Firestore) => {
	const snap = await sourceDb.collection('courses').get();
	console.log(`Found ${snap.size} courses in ${SOURCE_PROJECT}`);
	for (const doc of snap.docs) {
		const data = doc.data();
		const slug = String(data.slug ?? '');
		if (!slug) {
			console.warn(`Skipping course ${doc.id}: missing slug`);
			continue;
		}
		const payload = {
			name: String(data.name ?? ''),
			slug,
			description: String(data.description ?? ''),
			price: Number(data.price ?? 0),
			hours: Number(data.hours ?? 0),
			tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
			level: (['basic', 'intermediate', 'advanced'].includes(String(data.level))
				? data.level
				: 'basic') as string,
			dates: [],
		};
		await upsertBySlug(targetDb, 'courses', slug, payload);
	}
};

const copyCourseDescriptions = async (sourceDb: Firestore, targetDb: Firestore) => {
	const snap = await sourceDb.collection('courseDescriptions').get();
	console.log(`Found ${snap.size} courseDescriptions in ${SOURCE_PROJECT}`);
	for (const doc of snap.docs) {
		const data = doc.data();
		const slug = String(data.slug ?? doc.id);
		if (!slug) {
			console.warn(`Skipping courseDescription ${doc.id}: missing slug`);
			continue;
		}
		const { id: _id, ...rest } = data;
		const payload = {
			...rest,
			slug,
		};
		// Use slug as document ID (same as app saveCourseDescription)
		const clean = stripUndefined(payload) as Record<string, unknown>;
		await targetDb.collection('courseDescriptions').doc(slug).set(clean, { merge: true });
		console.log(`Upserted courseDescriptions/${slug}`);
	}
};

const copyTags = async (sourceDb: Firestore, targetDb: Firestore) => {
	const snap = await sourceDb.collection('tags').get();
	if (snap.empty) {
		console.log('No tags in source — skipping');
		return;
	}
	console.log(`Found ${snap.size} tags in ${SOURCE_PROJECT}`);
	for (const doc of snap.docs) {
		const data = doc.data();
		const slug = String(data.slug ?? '');
		if (!slug) continue;
		await upsertBySlug(targetDb, 'tags', slug, {
			name: String(data.name ?? ''),
			slug,
		});
	}
};

const main = async () => {
	const sourceApp = getOrInitApp(SOURCE_PROJECT, 'rp-arms-source');
	const targetApp = getOrInitApp(TARGET_PROJECT, 'szkolenia-target');
	const sourceDb = getFirestore(sourceApp);
	const targetDb = getFirestore(targetApp);

	await copyTags(sourceDb, targetDb);
	await copyCourses(sourceDb, targetDb);
	await copyCourseDescriptions(sourceDb, targetDb);

	console.log(`Done copying courses (no dates) + descriptions into ${TARGET_PROJECT}.`);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
