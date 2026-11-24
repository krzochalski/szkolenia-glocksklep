/**
 * Open external docs (Fakturownia) without losing the user gesture across `await`.
 * Adapted from stayfrosty `src/utils/externalTab.ts`.
 */

export type ExternalTab = {
	navigate: (url: string) => void;
	close: () => void;
};

const severOpener = (win: Window): void => {
	try {
		win.opener = null;
	} catch {
		// cross-origin / browser may deny
	}
};

export const prepareExternalTab = (): ExternalTab | null => {
	if (typeof window === 'undefined') return null;
	const win = window.open('about:blank', '_blank');
	if (!win) return null;
	severOpener(win);
	return {
		navigate: (url: string) => {
			win.location.href = url;
		},
		close: () => {
			try {
				win.close();
			} catch {
				// ignore
			}
		},
	};
};

export const openExternalUrl = (url: string): boolean => {
	if (typeof window === 'undefined') return false;
	const win = window.open(url, '_blank');
	if (!win) return false;
	severOpener(win);
	return true;
};

export const navigateExternalTab = (url: string, tab?: ExternalTab | null): boolean => {
	if (tab) {
		tab.navigate(url);
		return true;
	}
	return openExternalUrl(url);
};