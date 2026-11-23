import { focusManager } from '@tanstack/react-query';

/**
 * iOS Safari often skips `window` focus after backgrounding; visibilitychange is reliable.
 */
export const setupQueryFocusManager = (): (() => void) => {
	if (typeof document === 'undefined') {
		return () => undefined;
	}

	focusManager.setEventListener((handleFocus) => {
		const onVisibility = () => {
			handleFocus(document.visibilityState === 'visible');
		};
		const onWindowFocus = () => {
			handleFocus(true);
		};
		document.addEventListener('visibilitychange', onVisibility);
		window.addEventListener('focus', onWindowFocus);
		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('focus', onWindowFocus);
		};
	});

	return () => {
		focusManager.setEventListener(() => () => undefined);
	};
};
