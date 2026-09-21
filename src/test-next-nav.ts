let pathname = '/';

export const navState = {
	get pathname() {
		return pathname;
	},
};

export const setMockPathname = (next: string): void => {
	pathname = next;
};
