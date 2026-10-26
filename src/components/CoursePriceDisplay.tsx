'use client';

import { Price } from '@ui';
import { bruttoFromNetto } from '@/utils/pricing';

type CoursePriceDisplayProps = {
	readonly price: number;
};

/** Course detail price: stored netto → DS Price (brutto primary). */
export const CoursePriceDisplay = ({ price }: CoursePriceDisplayProps) => (
	<Price gross={bruttoFromNetto(price)} net={price} size='lg' />
);
