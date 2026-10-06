'use client';

import { Paths } from '@constants/paths';
import { Button, Stack } from '@ui';
import NextLink from 'next/link';
import { withAuthReturnQuery } from '@/utils/paths';

type Props = {
	readonly active: 'login' | 'register';
	readonly redirect: string;
	readonly termin?: string | null;
};

/** Equal-weight switch between register and login when returning from a course date. */
export const AuthModeSwitch = ({ active, redirect, termin }: Props) => {
	const loginHref = withAuthReturnQuery(Paths.login, { redirect, termin });
	const registerHref = withAuthReturnQuery(Paths.register, { redirect, termin });

	return (
		<Stack direction='row' spacing={1} sx={{ mb: 2 }}>
			<Button
				component={NextLink}
				href={registerHref}
				fullWidth
				variant={active === 'register' ? 'contained' : 'outlined'}
			>
				Nowe konto
			</Button>
			<Button
				component={NextLink}
				href={loginHref}
				fullWidth
				variant={active === 'login' ? 'contained' : 'outlined'}
			>
				Mam konto
			</Button>
		</Stack>
	);
};
