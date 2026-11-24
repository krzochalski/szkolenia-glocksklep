const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const;

/** Strip non-digits from NIP input. */
export const normalizeNip = (value: string): string => value.replace(/\D/g, '');

/** Validate Polish NIP checksum (10 digits). */
export const isValidPolishNip = (value: string): boolean => {
	const digits = normalizeNip(value);
	if (digits.length !== 10 || !/^\d{10}$/.test(digits)) return false;
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += Number(digits[i]) * NIP_WEIGHTS[i];
	}
	const checksum = sum % 11;
	if (checksum === 10) return false;
	return checksum === Number(digits[9]);
};