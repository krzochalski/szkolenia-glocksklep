'use client';

import { Price } from '@ui';

type NettoBruttoHintProps = {
	readonly netto: number;
};

/** Live dual-price caption under admin netto inputs. */
export const NettoBruttoHint = ({ netto }: NettoBruttoHintProps) => {
	if (!Number.isFinite(netto) || netto <= 0) return null;
	return <Price amount={netto} basis='netto' size='inline' sx={{ mt: 0.5, ml: 0.5, display: 'block' }} />;
};
