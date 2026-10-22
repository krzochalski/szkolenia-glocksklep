/** Chromium `beforeinstallprompt` event (not in lib.dom yet everywhere). */
export type BeforeInstallPromptEvent = Event & {
	readonly platforms: string[];
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let captureInitialized = false;

const notify = () => {
	for (const listener of listeners) {
		listener();
	}
};

/**
 * Capture `beforeinstallprompt` as early as possible — the event fires once and
 * is lost if nothing calls preventDefault.
 */
export const initPwaInstallCapture = (): void => {
	if (typeof window === 'undefined' || captureInitialized) return;
	captureInitialized = true;

	window.addEventListener('beforeinstallprompt', (event) => {
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
		notify();
	});

	window.addEventListener('appinstalled', () => {
		deferredPrompt = null;
		notify();
	});
};

export const getDeferredPwaInstallPrompt = (): BeforeInstallPromptEvent | null => deferredPrompt;

export const clearDeferredPwaInstallPrompt = (): void => {
	deferredPrompt = null;
	notify();
};

export const subscribePwaInstallPrompt = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** Register the minimal SW in `public/sw.js` (Chromium install criteria). */
export const registerPwaServiceWorker = (): void => {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
	void navigator.serviceWorker.register('/sw.js').catch(() => {
		/* ignore registration failures (e.g. insecure origin) */
	});
};
