/**
 * Upsert Piotr Krzoska instructor + billing into szkolenia-glocksklep Firestore.
 *
 * Default: hardcoded seed (mirrors rp-arms FALLBACK_BILLING + About constants).
 * Optional live copy from rparmsacademy:
 *   COPY_FROM_SOURCE=1 pnpm seed:piotr-instructor
 *
 * Usage (with ADC or GOOGLE_APPLICATION_CREDENTIALS):
 *   pnpm seed:piotr-instructor
 */
import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const TARGET_PROJECT =
	process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'szkolenia-glocksklep';
const SOURCE_PROJECT = process.env.SOURCE_FIRESTORE_PROJECT ?? 'rparmsacademy';
const COPY_FROM_SOURCE = process.env.COPY_FROM_SOURCE === '1';

const PIOTR_INSTRUCTOR_SEED = {
	name: 'PIOTR "GLOCKACCI" KRZOSKA',
	slug: 'piotr-krzoska',
	bio: 'Zdobywca wielu krajowych i regionalnych tytułów IPSC, IDPA, PiRO.',
	email: 'szkolenia@glocksklep.pl',
};

const PIOTR_BILLING_SEED = {
	name: 'Stay Frosty PIOTR KRZOSKA',
	address: 'Łaska 75/79',
	city: '98-220 Zduńska Wola, Polska',
	nip: '8291724148',
	website: 'http://glocksklep.pl/',
	phone: '+48530556523',
	bankName: 'mBank',
	bankAccount: 'PL19114020040000310277052051',
	paymentMethod: 'Przelew',
	issuePlace: 'Zduńska Wola',
	vatRate: 23,
};

const getOrInitApp = (projectId: string, name: string): App => {
	const existing = getApps().find((a) => a.name === name);
	if (existing) return existing;
	return initializeApp({ projectId }, name);
};

const fetchFromSource = async (): Promise<{
	instructor: typeof PIOTR_INSTRUCTOR_SEED;
	billing: typeof PIOTR_BILLING_SEED | null;
} | null> => {
	try {
		const sourceApp = getOrInitApp(SOURCE_PROJECT, 'rp-arms-source');
		const sourceDb = getFirestore(sourceApp);
		const snap = await sourceDb.collection('instructors').get();
		const match = snap.docs.find((d) => {
			const data = d.data();
			const slug = String(data.slug ?? '');
			const name = String(data.name ?? '').toLowerCase();
			return slug === 'piotr-krzoska' || name.includes('krzoska');
		});
		if (!match) {
			console.warn(`No Piotr Krzoska instructor in ${SOURCE_PROJECT}; using local seed.`);
			return null;
		}
		const data = match.data();
		const instructor = {
			name: String(data.name ?? PIOTR_INSTRUCTOR_SEED.name),
			slug: String(data.slug ?? PIOTR_INSTRUCTOR_SEED.slug),
			bio: String(data.bio ?? PIOTR_INSTRUCTOR_SEED.bio),
			email: data.email ? String(data.email) : PIOTR_INSTRUCTOR_SEED.email,
		};
		const billingSnap = await sourceDb
			.collection('billingData')
			.where('instructorId', '==', match.id)
			.limit(1)
			.get();
		let billing: typeof PIOTR_BILLING_SEED | null = null;
		if (!billingSnap.empty) {
			const b = billingSnap.docs[0].data();
			billing = {
				name: String(b.name ?? PIOTR_BILLING_SEED.name),
				address: String(b.address ?? PIOTR_BILLING_SEED.address),
				city: String(b.city ?? PIOTR_BILLING_SEED.city),
				nip: String(b.nip ?? PIOTR_BILLING_SEED.nip),
				website: String(b.website ?? PIOTR_BILLING_SEED.website),
				phone: String(b.phone ?? PIOTR_BILLING_SEED.phone),
				bankName: String(b.bankName ?? PIOTR_BILLING_SEED.bankName),
				bankAccount: String(b.bankAccount ?? PIOTR_BILLING_SEED.bankAccount),
				paymentMethod: String(b.paymentMethod ?? PIOTR_BILLING_SEED.paymentMethod),
				issuePlace: String(b.issuePlace ?? PIOTR_BILLING_SEED.issuePlace),
				vatRate: Number(b.vatRate ?? PIOTR_BILLING_SEED.vatRate),
			};
		}
		console.log(`Copied instructor from ${SOURCE_PROJECT}: ${instructor.name} (${match.id})`);
		return { instructor, billing };
	} catch (err) {
		console.warn(
			`Could not read ${SOURCE_PROJECT} (${err instanceof Error ? err.message : err}); using local seed.`
		);
		return null;
	}
};

const upsertTarget = async (
	db: Firestore,
	instructor: typeof PIOTR_INSTRUCTOR_SEED,
	billing: typeof PIOTR_BILLING_SEED
) => {
	const existing = await db
		.collection('instructors')
		.where('slug', '==', instructor.slug)
		.limit(1)
		.get();
	let instructorId: string;
	const payload = {
		name: instructor.name,
		slug: instructor.slug,
		bio: instructor.bio,
		email: instructor.email,
	};
	if (existing.empty) {
		const ref = await db.collection('instructors').add(payload);
		instructorId = ref.id;
		console.log(`Created instructors/${instructorId}`);
	} else {
		instructorId = existing.docs[0].id;
		await existing.docs[0].ref.set(payload, { merge: true });
		console.log(`Updated instructors/${instructorId}`);
	}

	const billingQ = await db
		.collection('billingData')
		.where('instructorId', '==', instructorId)
		.limit(1)
		.get();
	const billingPayload = { ...billing, instructorId };
	if (billingQ.empty) {
		const ref = await db.collection('billingData').add(billingPayload);
		console.log(`Created billingData/${ref.id}`);
	} else {
		await billingQ.docs[0].ref.set(billingPayload, { merge: true });
		console.log(`Updated billingData/${billingQ.docs[0].id}`);
	}
};

const main = async () => {
	const fromSource = COPY_FROM_SOURCE ? await fetchFromSource() : null;
	if (!COPY_FROM_SOURCE) {
		console.log('Using local Piotr Krzoska seed (set COPY_FROM_SOURCE=1 to read rparmsacademy).');
	}
	const targetApp = getOrInitApp(TARGET_PROJECT, 'szkolenia-target');
	const targetDb = getFirestore(targetApp);

	const instructor = fromSource?.instructor ?? PIOTR_INSTRUCTOR_SEED;
	const billing = fromSource?.billing ?? PIOTR_BILLING_SEED;
	await upsertTarget(targetDb, instructor, billing);
	console.log(`Done seeding into ${TARGET_PROJECT}.`);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
