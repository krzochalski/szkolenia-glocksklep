import { afterEach, describe, expect, it, vi } from 'vitest';

import { isIosDevice, isPWA } from './isPWA';

const stubMatchMedia = (matchesQuery: string | null) => {
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		writable: true,
		value: (query: string) =>
			({
				matches: matchesQuery !== null && query === matchesQuery,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			}) as MediaQueryList,
	});
};

describe('isPWA', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('detects standalone display mode', () => {
		stubMatchMedia('(display-mode: standalone)');
		expect(isPWA()).toBe(true);
	});

	it('detects iOS Safari standalone', () => {
		stubMatchMedia(null);
		Object.defineProperty(window.navigator, 'standalone', {
			configurable: true,
			value: true,
		});

		expect(isPWA()).toBe(true);
	});
});

describe('isIosDevice', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('detects iPhone user agent', () => {
		vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
		);

		expect(isIosDevice()).toBe(true);
	});
});
