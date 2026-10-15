'use client';

import { NettoBruttoHint } from '@components/NettoBruttoHint';
import { type Control, type FieldPath, type FieldValues, useWatch } from 'react-hook-form';

type WatchedNettoBruttoHintProps<T extends FieldValues> = {
	readonly control: Control<T>;
	readonly name: FieldPath<T>;
};

export const WatchedNettoBruttoHint = <T extends FieldValues>({
	control,
	name,
}: WatchedNettoBruttoHintProps<T>) => {
	const value = useWatch({ control, name });
	return <NettoBruttoHint netto={Number(value) || 0} />;
};
