'use client';

import { Alert, Box, Button, FeatureTile, HardShadow, Stack, Typography } from '@ui';
import { Groups, PersonOutlined } from '@ui/icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { ContactRequestFormat } from '@/types/contactRequest';
import type { HomepageDocument } from '@/types/homepage';
import { ContactRequestDialog } from './ContactRequestDialog';

type HomePrivateFormatsProps = {
	readonly content: HomepageDocument;
};

type FormatCardProps = {
	readonly icon: ReactNode;
	readonly title: string;
	readonly description: string;
	readonly onContact: () => void;
};

const FormatCard = ({ icon, title, description, onContact }: FormatCardProps) => (
	<HardShadow
		sx={{
			p: 3,
			bgcolor: 'background.paper',
			display: 'flex',
			flexDirection: { xs: 'column', sm: 'row' },
			gap: 2,
			alignItems: { xs: 'stretch', sm: 'center' },
			justifyContent: 'space-between',
			transition: 'background-color 0.2s',
			'&:hover': { bgcolor: 'surface.muted' },
		}}
	>
		<Box sx={{ flex: 1, minWidth: 0 }}>
			<FeatureTile variant='row' icon={icon} title={title} description={description} />
		</Box>
		<Button
			variant='contained'
			onClick={onContact}
			sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
		>
			Zostaw kontakt
		</Button>
	</HardShadow>
);

export const HomePrivateFormats = ({ content }: HomePrivateFormatsProps) => {
	const [dialogFormat, setDialogFormat] = useState<ContactRequestFormat | null>(null);
	const [successFlash, setSuccessFlash] = useState(false);

	return (
		<HardShadow sx={{ p: { xs: 3, md: 4 }, bgcolor: 'surface.muted' }}>
			<Typography variant='h4' component='h2' gutterBottom>
				Indywidualne i grupy
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3, maxWidth: 640 }}>
				Otwarte terminy to tylko część oferty. Pracujemy też 1:1 oraz z dedykowanymi grupami 4–6
				osób.
			</Typography>

			{successFlash ? (
				<Alert severity='success' sx={{ mb: 3 }} onClose={() => setSuccessFlash(false)}>
					Dziękujemy — zgłoszenie zostało wysłane. Odezwiemy się wkrótce.
				</Alert>
			) : null}

			<Stack spacing={3}>
				<FormatCard
					icon={<PersonOutlined sx={{ color: 'ink.main' }} />}
					title={content.privateIndividualTitle}
					description={content.privateIndividualBody}
					onContact={() => setDialogFormat('individual')}
				/>
				<FormatCard
					icon={<Groups sx={{ color: 'ink.main' }} />}
					title={content.privateGroupTitle}
					description={content.privateGroupBody}
					onContact={() => setDialogFormat('group')}
				/>
			</Stack>

			<ContactRequestDialog
				open={dialogFormat !== null}
				format={dialogFormat}
				onClose={() => setDialogFormat(null)}
				onSuccess={() => setSuccessFlash(true)}
			/>
		</HardShadow>
	);
};
