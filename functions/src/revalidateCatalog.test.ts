import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestCatalogRevalidation } from './revalidateCatalog';

describe('requestCatalogRevalidation', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('no-ops without secret', async () => {
		vi.stubEnv('REVALIDATE_SECRET', '');
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		await requestCatalogRevalidation();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('POSTs to site origin with secret header', async () => {
		vi.stubEnv('REVALIDATE_SECRET', 'test-secret');
		vi.stubEnv('SITE_ORIGIN', 'https://example.test');
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => '',
		});
		vi.stubGlobal('fetch', fetchMock);

		await requestCatalogRevalidation({ slug: 'intro' });

		expect(fetchMock).toHaveBeenCalledWith(
			'https://example.test/api/revalidate',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'x-revalidate-secret': 'test-secret',
				}),
			})
		);
		const body = JSON.parse(
			(fetchMock.mock.calls[0]?.[1] as { body: string }).body
		) as { slug?: string };
		expect(body.slug).toBe('intro');
	});
});
