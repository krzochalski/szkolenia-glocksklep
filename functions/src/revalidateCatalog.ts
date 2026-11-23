const DEFAULT_ORIGIN = 'https://szkolenia.glocksklep.pl';

export type RevalidateCatalogInput = {
	readonly paths?: string[];
	readonly slug?: string;
};

/**
 * Ask the Next App Hosting origin to purge catalog ISR paths.
 * No-ops when `REVALIDATE_SECRET` is unset (local / misconfigured).
 */
export const requestCatalogRevalidation = async (
	input: RevalidateCatalogInput = {}
): Promise<void> => {
	const secret = process.env.REVALIDATE_SECRET?.trim();
	if (!secret) return;

	const origin = (
		process.env.SITE_ORIGIN?.trim() ||
		process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim() ||
		DEFAULT_ORIGIN
	).replace(/\/$/, '');

	try {
		const res = await fetch(`${origin}/api/revalidate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-revalidate-secret': secret,
			},
			body: JSON.stringify({
				paths: input.paths,
				slug: input.slug,
			}),
		});
		if (!res.ok) {
			console.warn('Catalog revalidate failed', res.status, await res.text().catch(() => ''));
		}
	} catch (err) {
		console.warn('Catalog revalidate error', err);
	}
};
