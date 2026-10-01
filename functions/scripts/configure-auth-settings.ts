/**
 * Configure Identity Toolkit: authorized domains + email link sign-in + action URL.
 * Uses ADC via firebase-admin (no token printed to stdout).
 *
 * Note: Firebase may reject callbackUri updates with EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED.
 * Password-reset / email-link mails are then sent via Cloud Functions with rewritten links
 * to https://szkolenia.glocksklep.pl/auth/action.
 */
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';

const PROJECT = 'szkolenia-glocksklep';
const ACTION_URL = 'https://szkolenia.glocksklep.pl/auth/action';
const DOMAINS = [
	'szkolenia.glocksklep.pl',
	'localhost',
	'szkolenia-glocksklep.firebaseapp.com',
	'szkolenia-glocksklep.web.app',
];

if (getApps().length === 0) {
	initializeApp({ credential: applicationDefault(), projectId: PROJECT });
}

const getAccessToken = async (): Promise<string> => {
	const cred = applicationDefault();
	const token = await cred.getAccessToken();
	if (!token.access_token) throw new Error('No access token from ADC');
	return token.access_token;
};

const main = async () => {
	const accessToken = await getAccessToken();
	const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`;

	const headers = {
		Authorization: `Bearer ${accessToken}`,
		'x-goog-user-project': PROJECT,
	};

	const getRes = await fetch(base, { headers });
	if (!getRes.ok) {
		throw new Error(`GET config failed: ${getRes.status} ${await getRes.text()}`);
	}
	const current = (await getRes.json()) as {
		authorizedDomains?: string[];
		signIn?: Record<string, unknown>;
		notification?: { sendEmail?: { callbackUri?: string } };
	};

	const domains = [...new Set([...(current.authorizedDomains ?? []), ...DOMAINS])];

	const patchRes = await fetch(`${base}?updateMask=${encodeURIComponent('authorizedDomains,signIn.email')}`, {
		method: 'PATCH',
		headers: {
			...headers,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			authorizedDomains: domains,
			signIn: {
				...(current.signIn ?? {}),
				email: {
					enabled: true,
					passwordRequired: false,
				},
			},
		}),
	});
	if (!patchRes.ok) {
		throw new Error(`PATCH config failed: ${patchRes.status} ${await patchRes.text()}`);
	}

	console.log('authorizedDomains:', domains.sort().join(', '));
	console.log('email sign-in enabled (passwordRequired=false → email link OK)');

	const currentCallback = current.notification?.sendEmail?.callbackUri;
	console.log('Current callbackUri:', currentCallback ?? '(none)');

	if (currentCallback !== ACTION_URL) {
		const cbRes = await fetch(
			`${base}?updateMask=${encodeURIComponent('notification.sendEmail.callbackUri')}`,
			{
				method: 'PATCH',
				headers: {
					...headers,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					notification: { sendEmail: { callbackUri: ACTION_URL } },
				}),
			}
		);
		if (cbRes.ok) {
			console.log('callbackUri set to:', ACTION_URL);
		} else {
			const body = await cbRes.text();
			console.warn(
				`Could not set callbackUri to ${ACTION_URL} (${cbRes.status}). ` +
					'App uses Cloud Functions auth mail with rewritten links instead.',
			);
			console.warn(body);
		}
	} else {
		console.log('callbackUri already:', ACTION_URL);
	}
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
