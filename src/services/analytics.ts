import type { Analytics } from 'firebase/analytics';
import { firebaseApp } from './firebase';

/** Cookie name used by `react-cookie-consent` in `AppProviders`. */
export const COOKIES_CONSENT_COOKIE = 'cookiesConsent';

/** Default accept value written by `react-cookie-consent`. */
export const COOKIES_CONSENT_ACCEPTED = 'true';

export const isCookiesConsentAccepted = (value: string | undefined): boolean =>
	value === COOKIES_CONSENT_ACCEPTED;

let analyticsInstance: Analytics | null = null;
let enablePromise: Promise<Analytics | null> | null = null;

const hasMeasurementId = (): boolean =>
	Boolean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim());

/**
 * Starts Firebase Analytics after cookie consent ("Spoko").
 * No-op on the server, when measurement ID is missing, or when Analytics is unsupported.
 */
export const enableAnalytics = async (): Promise<Analytics | null> => {
	if (typeof window === 'undefined' || !hasMeasurementId()) {
		return null;
	}

	if (analyticsInstance) {
		const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
		setAnalyticsCollectionEnabled(analyticsInstance, true);
		return analyticsInstance;
	}

	if (!enablePromise) {
		enablePromise = (async () => {
			const { initializeAnalytics, isSupported, setAnalyticsCollectionEnabled } =
				await import('firebase/analytics');
			if (!(await isSupported())) {
				return null;
			}
			analyticsInstance = initializeAnalytics(firebaseApp, {
				config: {
					send_page_view: false,
					allow_google_signals: false,
					allow_ad_personalization_signals: false,
				},
			});
			setAnalyticsCollectionEnabled(analyticsInstance, true);
			return analyticsInstance;
		})().catch(() => {
			enablePromise = null;
			return null;
		});
	}

	return enablePromise;
};

/** Stops collection after decline; safe if Analytics was never started. */
export const disableAnalytics = async (): Promise<void> => {
	if (typeof window === 'undefined' || !analyticsInstance) {
		return;
	}
	const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
	setAnalyticsCollectionEnabled(analyticsInstance, false);
};

/** Logs a GA4 `page_view` when Analytics is active (SPA navigations). */
export const logAnalyticsPageView = async (path: string): Promise<void> => {
	const instance = analyticsInstance ?? (await enablePromise);
	if (!instance || typeof window === 'undefined') {
		return;
	}
	const { logEvent } = await import('firebase/analytics');
	logEvent(instance, 'page_view', {
		page_path: path,
		page_location: window.location.href,
		page_title: document.title,
	});
};
