'use client';

import type { PriceMode } from '@ui';
import {
	createContext,
	type ReactNode,
	use,
	useState,
} from 'react';

type PriceModeContextValue = {
	readonly mode: PriceMode;
	readonly setMode: (mode: PriceMode) => void;
};

const PriceModeContext = createContext<PriceModeContextValue | null>(null);

export const PriceModeProvider = ({ children }: { readonly children: ReactNode }) => {
	const [mode, setMode] = useState<PriceMode>('netto');

	return <PriceModeContext value={{ mode, setMode }}>{children}</PriceModeContext>;
};

export const usePriceMode = (): PriceModeContextValue => {
	const ctx = use(PriceModeContext);
	if (!ctx) {
		throw new Error('usePriceMode must be used within PriceModeProvider');
	}
	return ctx;
};
