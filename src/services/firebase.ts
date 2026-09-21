import { initializeApp } from 'firebase/app';

const requireEnv = (name: string, value: string | undefined): string => {
	const trimmed = value?.trim();
	if (!trimmed) {
		throw new Error(
			`Missing ${name}. Copy .env.example to .env.local and fill Firebase web config values.`,
		);
	}
	return trimmed;
};

// NEXT_PUBLIC_* must be referenced statically so Next.js can inline them.
const firebaseConfig = {
	apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
	authDomain: requireEnv(
		'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
		process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	),
	projectId: requireEnv(
		'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	),
	storageBucket: requireEnv(
		'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
		process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	),
	messagingSenderId: requireEnv(
		'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
		process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	),
	appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

export const firebaseApp = initializeApp(firebaseConfig);
