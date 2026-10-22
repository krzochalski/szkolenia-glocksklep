import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	clearDeferredPwaInstallPrompt,
	getDeferredPwaInstallPrompt,
	initPwaInstallCapture,
	subscribePwaInstallPrompt,
} from './pwaInstallPrompt';

describe('pwaInstallPrompt', () => {
	afterEach(() => {
		clearDeferredPwaInstallPrompt();
	});

	it('stores beforeinstallprompt and notifies subscribers', () => {
		initPwaInstallCapture();
		const listener = vi.fn();
		const unsubscribe = subscribePwaInstallPrompt(listener);

		const prompt = vi.fn(async () => undefined);
		const userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
		const event = new Event('beforeinstallprompt') as Event & {
			prompt: typeof prompt;
			userChoice: typeof userChoice;
			platforms: string[];
			preventDefault: () => void;
		};
		Object.assign(event, { prompt, userChoice, platforms: ['web'] });

		window.dispatchEvent(event);

		expect(getDeferredPwaInstallPrompt()).toBe(event);
		expect(listener).toHaveBeenCalled();

		clearDeferredPwaInstallPrompt();
		expect(getDeferredPwaInstallPrompt()).toBeNull();

		unsubscribe();
	});
});
