/**
 * Configure Identity Toolkit: authorized domains + email link sign-in.
 * Uses ADC via firebase-admin (no token printed to stdout).
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
	console.log(`Custom action URL target: ${ACTION_URL}`);

	const legacyGet = await fetch(
		`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?projectId=${PROJECT}`,
		{ headers }
	);
	if (legacyGet.ok) {
		const legacy = (await legacyGet.json()) as Record<string, unknown>;
		console.log('Legacy project config keys:', Object.keys(legacy).join(', '));
		if ('authorizedDomains' in legacy) {
			console.log('Legacy authorizedDomains present');
		}
	} else {
		console.log('Legacy getProjectConfig:', legacyGet.status, await legacyGet.text());
	}
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
