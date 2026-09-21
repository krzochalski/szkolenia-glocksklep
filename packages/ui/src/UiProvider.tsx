import type { ReactNode } from 'react';

import { CssBaseline, ThemeProvider } from './primitives';
import theme from './theme';

type UiProviderProps = {
	readonly children: ReactNode;
};

export const UiProvider = ({ children }: UiProviderProps) => (
	<ThemeProvider theme={theme}>
		<CssBaseline />
		{children}
	</ThemeProvider>
);
