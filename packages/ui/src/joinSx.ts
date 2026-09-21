import type { BoxProps } from './primitives';

export const joinSx = (base: NonNullable<BoxProps['sx']>, sx?: BoxProps['sx']): BoxProps['sx'] => {
	if (sx == null) return base;
	const start = Array.isArray(base) ? base : [base];
	const extra = Array.isArray(sx) ? sx : [sx];
	return [...start, ...extra];
};
