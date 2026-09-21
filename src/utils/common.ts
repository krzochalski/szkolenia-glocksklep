/**
 * Recursively removes keys with `undefined` values from an object.
 * Firestore does not accept `undefined` — only omit the key or use `null`.
 */
// biome-ignore lint/suspicious/noExplicitAny: generic deep-clean utility
export const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
	if (Array.isArray(obj)) {
		return obj.map(
			(item) => (typeof item === 'object' && item !== null ? stripUndefined(item) : item)
			// biome-ignore lint/suspicious/noExplicitAny: recursive array handling
		) as any;
	}
	// biome-ignore lint/suspicious/noExplicitAny: building cleaned object
	const cleaned: any = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) {
			cleaned[key] = stripUndefined(value);
		} else if (typeof value === 'object' && value !== null) {
			cleaned[key] = stripUndefined(value);
		} else {
			cleaned[key] = value;
		}
	}
	return cleaned;
};
