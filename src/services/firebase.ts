import { initializeApp } from 'firebase/app';

type Env = { env?: Record<string, string | undefined> };

const readEnv = (key: string): string | undefined =>
	(globalThis as typeof globalThis & { process?: Env }).process?.env?.[key];

const firebaseConfig = {
	apiKey: readEnv('NEXT_PUBLIC_FIREBASE_API_KEY') ?? 'AIzaSyD3fQ-uG7RUbdO1WpuSchmoASPDlWcKXsA',
	authDomain: readEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') ?? 'szkolenia-glocksklep.firebaseapp.com',
	projectId: readEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ?? 'szkolenia-glocksklep',
	storageBucket:
		readEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') ?? 'szkolenia-glocksklep.firebasestorage.app',
	messagingSenderId: readEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ?? '799987811307',
	appId: readEnv('NEXT_PUBLIC_FIREBASE_APP_ID') ?? '1:799987811307:web:65da36f51e4f13d19bcfae',
	measurementId: readEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID') ?? 'G-NNQSJWT4K9',
};

export const firebaseApp = initializeApp(firebaseConfig);
