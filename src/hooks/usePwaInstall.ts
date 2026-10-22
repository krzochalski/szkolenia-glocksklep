import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { isIosDevice, isPWA } from '@/utils/isPWA';
import {
	clearDeferredPwaInstallPrompt,
	getDeferredPwaInstallPrompt,
	subscribePwaInstallPrompt,
} from '@/utils/pwaInstallPrompt';

const subscribe = (onStoreChange: () => void) => subscribePwaInstallPrompt(onStoreChange);

const getSnapshot = () => getDeferredPwaInstallPrompt();

export const usePwaInstall = () => {
	const deferred = useSyncExternalStore(subscribe, getSnapshot, () => null);
	const [installed, setInstalled] = useState(() => isPWA());
	const [iosHint] = useState(() => isIosDevice() && !isPWA());
	const [installing, setInstalling] = useState(false);

	useEffect(() => {
		const syncInstalled = () => setInstalled(isPWA());
		syncInstalled();
		window.addEventListener('appinstalled', syncInstalled);
		return () => window.removeEventListener('appinstalled', syncInstalled);
	}, []);

	const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
		const promptEvent = getDeferredPwaInstallPrompt();
		if (!promptEvent) return 'unavailable';

		setInstalling(true);
		try {
			await promptEvent.prompt();
			const { outcome } = await promptEvent.userChoice;
			clearDeferredPwaInstallPrompt();
			if (outcome === 'accepted') {
				setInstalled(true);
			}
			return outcome;
		} finally {
			setInstalling(false);
		}
	}, []);

	return {
		installed,
		canInstall: Boolean(deferred) && !installed,
		iosHint: iosHint && !installed,
		installing,
		install,
	};
};
