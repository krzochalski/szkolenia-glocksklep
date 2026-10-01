'use client';

import { Paths } from '@constants/paths';
import { NotFoundPage, NotFoundPageAction, type NotFoundPageProps } from '@ui';
import { CalendarMonth, HomeIcon } from '@ui/icons';
import NextLink from 'next/link';

type Props = {
	readonly sx?: NotFoundPageProps['sx'];
};

export const NotFoundView = ({ sx }: Props) => (
	<NotFoundPage
		sx={sx}
		actions={
			<>
				<NotFoundPageAction
					component={NextLink}
					href={Paths.home}
					startIcon={<HomeIcon sx={{ fontSize: '0.875rem' }} />}
				>
					POWRÓT DO STRONY GŁÓWNEJ
				</NotFoundPageAction>
				<NotFoundPageAction
					variant='secondary'
					component={NextLink}
					href={Paths.najblizszeSzkolenia}
					startIcon={<CalendarMonth sx={{ fontSize: '0.875rem' }} />}
				>
					NAJBLIŻSZE SZKOLENIA
				</NotFoundPageAction>
			</>
		}
	/>
);
