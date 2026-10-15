'use client';

import { Typography } from '@ui';
import { formatPlnNettoBrutto } from '@/utils/pricing';

type NettoBruttoHintProps = {
	readonly netto: number;
};

/** Live dual-price caption under admin netto inputs. */
export const NettoBruttoHint = ({ netto }: NettoBruttoHintProps) => {
	if (!Number.isFinite(netto) || netto <= 0) return null;
	return (
		<Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, ml: 0.5, display: 'block' }}>
			{formatPlnNettoBrutto(netto)}
		</Typography>
	);
};
