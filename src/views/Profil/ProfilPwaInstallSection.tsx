'use client';

import { usePwaInstall } from '@hooks';
import { Box, Button, MotionAlert, Typography } from '@ui';
import { GetApp, IosShare } from '@ui/icons';
import { useState } from 'react';

export const ProfilPwaInstallSection = () => {
	const { installed, canInstall, iosHint, installing, install } = usePwaInstall();
	const [installMessage, setInstallMessage] = useState<string | null>(null);

	const onInstallApp = async () => {
		setInstallMessage(null);
		const outcome = await install();
		if (outcome === 'accepted') {
			setInstallMessage('Aplikacja zainstalowana.');
		} else if (outcome === 'dismissed') {
			setInstallMessage('Instalacja anulowana.');
		} else {
			setInstallMessage(
				'Instalacja niedostępna w tej chwili. Odśwież stronę i spróbuj ponownie.'
			);
		}
	};

	return (
		<Box
			sx={{
				mt: 4,
				pt: 3,
				borderTop: 1,
				borderColor: 'divider',
				display: 'flex',
				flexDirection: 'column',
				gap: 1.5,
			}}
		>
			<Box>
				<Typography variant='h6' component='h2' gutterBottom>
					Aplikacja
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					Zainstaluj GLOCKSKLEP Szkolenia na telefonie lub komputerze (PWA).
				</Typography>
			</Box>
			{installed ? (
				<MotionAlert show severity='success'>
					Aplikacja jest już zainstalowana na tym urządzeniu.
				</MotionAlert>
			) : canInstall ? (
				<Button
					type='button'
					variant='outlined'
					startIcon={<GetApp />}
					onClick={onInstallApp}
					disabled={installing}
					sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
				>
					Zainstaluj aplikację
				</Button>
			) : iosHint ? (
				<MotionAlert show severity='info' icon={<IosShare fontSize='inherit' />}>
					Na iPhonie / iPadzie: ikona Udostępnij → „Do ekranu początkowego”.
				</MotionAlert>
			) : (
				<Typography variant='body2' color='text.secondary'>
					Instalacja niedostępna w tej przeglądarce. Użyj Chrome, Edge albo Safari (iOS), albo
					odśwież stronę gdy aplikacja będzie gotowa do instalacji.
				</Typography>
			)}
			<MotionAlert
				show={Boolean(installMessage)}
				severity={installMessage?.includes('zainstalowana') ? 'success' : 'info'}
			>
				{installMessage}
			</MotionAlert>
		</Box>
	);
};
