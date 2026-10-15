'use client';

import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO, SOCIAL_LINKS } from '@constants/contact';
import { Paths } from '@constants/paths';
import { Box, type BoxProps, Container, Link, Stack, Typography } from '@ui';
import NextLink from 'next/link';

type SiteFooterProps = {
	readonly sx?: BoxProps['sx'];
};

export const SiteFooter = ({ sx }: SiteFooterProps) => (
	<Box
		component='footer'
		sx={[
			{
				mt: 'auto',
				borderTop: 1,
				borderColor: 'divider',
				py: 3,
				bgcolor: 'background.subtle',
			},
			...(Array.isArray(sx) ? sx : [sx]),
		]}
	>
		<Container maxWidth='xl'>
			<Stack spacing={2}>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					sx={{
						alignItems: { xs: 'flex-start', sm: 'center' },
						justifyContent: 'space-between',
					}}
				>
					<Typography variant='body2' color='text.secondary'>
						© {new Date().getFullYear()} GLOCKSKLEP Szkolenia
					</Typography>
					<Stack direction='row' spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
						<Link
							component={NextLink}
							href={Paths.regulamin}
							underline='hover'
							color='text.secondary'
						>
							Regulamin
						</Link>
						<Link
							component={NextLink}
							href={Paths.politykaPrywatnosci}
							underline='hover'
							color='text.secondary'
						>
							Polityka prywatności
						</Link>
						<Link component={NextLink} href={Paths.faq} underline='hover' color='text.secondary'>
							FAQ
						</Link>
					</Stack>
				</Stack>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					useFlexGap
					sx={{ flexWrap: 'wrap', color: 'text.secondary' }}
				>
					<Link href={PUBLIC_CONTACT_MAILTO} underline='hover' color='text.secondary' variant='body2'>
						{PUBLIC_CONTACT_EMAIL}
					</Link>
					<Link
						href={SOCIAL_LINKS.instagram}
						target='_blank'
						rel='noopener noreferrer'
						underline='hover'
						color='text.secondary'
						variant='body2'
					>
						Instagram
					</Link>
					<Link
						href={SOCIAL_LINKS.youtube}
						target='_blank'
						rel='noopener noreferrer'
						underline='hover'
						color='text.secondary'
						variant='body2'
					>
						YouTube
					</Link>
				</Stack>
			</Stack>
		</Container>
	</Box>
);
