import { GoogleAuth, Impersonated, type AuthClient } from 'google-auth-library';
import { type NextRequest, NextResponse } from 'next/server';

/** Cloud Run URL for the `api` 2nd gen function (audience + origin). */
export const FUNCTIONS_API_ORIGIN =
	process.env.FUNCTIONS_API_ORIGIN ?? 'https://api-3ulnhgpqbq-ew.a.run.app';

/**
 * Local Next needs a service account that can invoke Cloud Run (org blocks allUsers).
 * On App Hosting the runtime SA already has roles/run.invoker — leave unset.
 */
const IMPERSONATE_SA =
	process.env.FUNCTIONS_API_IMPERSONATE_SA ??
	(process.env.NODE_ENV !== 'production'
		? 'firebase-app-hosting-compute@szkolenia-glocksklep.iam.gserviceaccount.com'
		: undefined);

const auth = new GoogleAuth({
	scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const getGoogleAuthHeader = async (): Promise<string> => {
	if (IMPERSONATE_SA) {
		const sourceClient = (await auth.getClient()) as AuthClient;
		const impersonated = new Impersonated({
			sourceClient,
			targetPrincipal: IMPERSONATE_SA,
			lifetime: 3600,
			delegates: [],
			targetScopes: ['https://www.googleapis.com/auth/cloud-platform'],
		});
		const idToken = await impersonated.fetchIdToken(FUNCTIONS_API_ORIGIN);
		return `Bearer ${idToken}`;
	}
	const client = await auth.getIdTokenClient(FUNCTIONS_API_ORIGIN);
	const headers = await client.getRequestHeaders();
	const value =
		typeof headers.get === 'function'
			? (headers.get('Authorization') ?? headers.get('authorization'))
			: null;
	if (!value) throw new Error('Missing Google ID token');
	return value;
};

/**
 * Proxy browser `/api/*` calls to the private Cloud Run function.
 * Sets Google ID token in Authorization; forwards Firebase Bearer as X-Firebase-Authorization.
 */
export const proxyFunctionsApi = async (
	req: NextRequest,
	pathSegments: string[]
): Promise<NextResponse> => {
	const targetPath = `/api/${pathSegments.map(encodeURIComponent).join('/')}`;
	const url = `${FUNCTIONS_API_ORIGIN}${targetPath}${req.nextUrl.search}`;

	let googleAuth: string;
	try {
		googleAuth = await getGoogleAuthHeader();
	} catch {
		return NextResponse.json({ error: 'Nie udało się połączyć z API.' }, { status: 502 });
	}

	const headers: Record<string, string> = {
		Authorization: googleAuth,
	};
	const contentType = req.headers.get('content-type');
	if (contentType) headers['Content-Type'] = contentType;

	const firebaseAuth = req.headers.get('authorization');
	if (firebaseAuth) {
		headers['X-Firebase-Authorization'] = firebaseAuth;
	}

	const method = req.method.toUpperCase();
	const body =
		method === 'GET' || method === 'HEAD' || method === 'OPTIONS' ? undefined : await req.text();

	try {
		const res = await fetch(url, { method, headers, body });
		const text = await res.text();
		return new NextResponse(text, {
			status: res.status,
			headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
		});
	} catch {
		return NextResponse.json({ error: 'Nie udało się połączyć z API.' }, { status: 502 });
	}
};
