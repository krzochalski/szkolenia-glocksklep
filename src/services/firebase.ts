import { initializeApp } from 'firebase/app';

type Env = { env?: Record<string, string | undefined> };

const readEnv = (key: string): string | undefined =>
	(globalThis as typeof globalThis & { process?: Env }).process?.env?.[key];

const requireEnv = (key: string): string => {
	const value = readEnv(key)?.trim();
	if (!value) {
		throw new Error(
			`Missing ${key}. Copy .env.example to .env.local and fill Firebase web config values.`,
		);
	}
	return value;
};

const firebaseConfig = {
	apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
	authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
	projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
	storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
	messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
	appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
	measurementId: readEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID')?.trim() || undefined,
};

export const firebaseApp = initializeApp(firebaseConfig);
