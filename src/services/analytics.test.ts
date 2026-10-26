import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const initializeAnalytics = vi.fn();
const isSupported = vi.fn();
const setAnalyticsCollectionEnabled = vi.fn();
const logEvent = vi.fn();

vi.mock('firebase/analytics', () => ({
	initializeAnalytics: (...args: unknown[]) => initializeAnalytics(...args),
	isSupported: (...args: unknown[]) => isSupported(...args),
	setAnalyticsCollectionEnabled: (...args: unknown[]) => setAnalyticsCollectionEnabled(...args),
	logEvent: (...args: unknown[]) => logEvent(...args),
}));

vi.mock('./firebase', () => ({
	firebaseApp: { name: '[DEFAULT]' },
}));

describe('analytics', () => {
	beforeEach(() => {
		vi.resetModules();
		initializeAnalytics.mockReset();
		isSupported.mockReset();
		setAnalyticsCollectionEnabled.mockReset();
		logEvent.mockReset();
		isSupported.mockResolvedValue(true);
		initializeAnalytics.mockReturnValue({ app: { name: '[DEFAULT]' } });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('treats react-cookie-consent accept value as consent', async () => {
		const { isCookiesConsentAccepted, COOKIES_CONSENT_ACCEPTED } = await import('./analytics');
		expect(isCookiesConsentAccepted(COOKIES_CONSENT_ACCEPTED)).toBe(true);
		expect(isCookiesConsentAccepted('false')).toBe(false);
		expect(isCookiesConsentAccepted(undefined)).toBe(false);
	});

	it('does not initialize Analytics without a measurement ID', async () => {
		vi.stubEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', '');
		const { enableAnalytics } = await import('./analytics');
		await expect(enableAnalytics()).resolves.toBeNull();
		expect(initializeAnalytics).not.toHaveBeenCalled();
	});

	it('initializes Analytics once when supported and measurement ID is set', async () => {
		vi.stubEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'G-TEST123');
		const { enableAnalytics, logAnalyticsPageView } = await import('./analytics');

		const first = await enableAnalytics();
		const second = await enableAnalytics();

		expect(first).toEqual({ app: { name: '[DEFAULT]' } });
		expect(second).toBe(first);
		expect(initializeAnalytics).toHaveBeenCalledTimes(1);
		expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(first, true);

		await logAnalyticsPageView('/kursy');
		expect(logEvent).toHaveBeenCalledWith(
			first,
			'page_view',
			expect.objectContaining({ page_path: '/kursy' }),
		);
	});

	it('disables collection on decline after init', async () => {
		vi.stubEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'G-TEST123');
		const { enableAnalytics, disableAnalytics } = await import('./analytics');

		const instance = await enableAnalytics();
		await disableAnalytics();

		expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(instance, false);
	});

	it('skips init when Analytics is unsupported', async () => {
		vi.stubEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'G-TEST123');
		isSupported.mockResolvedValue(false);
		const { enableAnalytics } = await import('./analytics');

		await expect(enableAnalytics()).resolves.toBeNull();
		expect(initializeAnalytics).not.toHaveBeenCalled();
	});
});
