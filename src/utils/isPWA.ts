export const isPWA = (): boolean => {
	if (typeof window === 'undefined') return false;

	if (window.matchMedia('(display-mode: standalone)').matches) return true;
	if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
	if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;

	const nav = window.navigator as Navigator & { standalone?: boolean };
	return nav.standalone === true;
};

export const isIosDevice = (): boolean => {
	if (typeof window === 'undefined') return false;

	const ua = window.navigator.userAgent;
	if (/iPad|iPhone|iPod/.test(ua)) return true;

	return window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
};
