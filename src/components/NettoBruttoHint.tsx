'use client';

import { Price } from '@ui';
import { bruttoFromNetto } from '@/utils/pricing';

type NettoBruttoHintProps = {
	readonly netto: number;
};

/** Live dual-price caption under admin netto inputs. */
export const NettoBruttoHint = ({ netto }: NettoBruttoHintProps) => {
	if (!Number.isFinite(netto) || netto <= 0) return null;
	return (
		<Price
			gross={bruttoFromNetto(netto)}
			net={netto}
			size='sm'
			sx={{ mt: 0.5, ml: 0.5, display: 'block' }}
		/>
	);
};
