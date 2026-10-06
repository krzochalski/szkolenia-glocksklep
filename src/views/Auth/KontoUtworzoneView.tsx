'use client';

import { Paths } from '@constants/paths';
import { Box, Button, brand, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { safeRedirectPath, withRedirectQuery } from '@/utils/paths';

export const KontoUtworzoneView = () => {
	const searchParams = useSearchParams();
	const redirectTo = safeRedirectPath(searchParams.get('redirect'), Paths.profil);
	const loginHref = withRedirectQuery(Paths.login, redirectTo);

	return (
		<Box sx={{ px: 2, py: 6, maxWidth: 560, mx: 'auto' }}>
			<Stack spacing={3}>
				<Typography variant='h4' component='h1' sx={{ textAlign: 'center', fontWeight: 800 }}>
					Konto zostało utworzone
				</Typography>

				<Box
					role='status'
					sx={{
						p: { xs: 2.5, sm: 3 },
						border: `3px solid ${brand.ink}`,
						boxShadow: `6px 6px 0 ${brand.ink}`,
						bgcolor: brand.paper,
					}}
				>
					<Typography
						variant='h6'
						component='p'
						sx={{ fontWeight: 800, mb: 1.5, color: brand.accentDark ?? brand.ink }}
					>
						Sprawdź skrzynkę e-mail
					</Typography>
					<Typography sx={{ mb: 2, fontSize: '1.05rem', lineHeight: 1.5 }}>
						Wysłaliśmy wiadomość z <strong>linkiem do ustawienia hasła</strong>. Bez tego kroku nie
						zalogujesz się do konta.
					</Typography>
					<Box
						sx={{
							p: 2,
							border: `2px solid ${brand.ink}`,
							bgcolor: 'warning.light',
						}}
					>
						<Typography sx={{ fontWeight: 800, mb: 0.5 }}>Uwaga — folder spam</Typography>
						<Typography variant='body2' sx={{ lineHeight: 1.5 }}>
							To nowa platforma, więc niektóre programy pocztowe mogą oznaczyć naszą wiadomość jako
							spam. <strong>Sprawdź też folder spam / oferty / inne</strong>, jeśli mail nie pojawi
							się w skrzynce odbiorczej w ciągu kilku minut.
						</Typography>
					</Box>
				</Box>

				<Typography color='text.secondary' sx={{ textAlign: 'center' }}>
					Po ustawieniu hasła wróć tutaj i zaloguj się.
				</Typography>

				<Button component={NextLink} href={loginHref} variant='contained' size='large' fullWidth>
					Przejdź do logowania
				</Button>
			</Stack>
		</Box>
	);
};
