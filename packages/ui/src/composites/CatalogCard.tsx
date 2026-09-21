import { Box, Chip, Typography } from '../primitives';
import type { ReactNode } from 'react';
import { HardShadow, MonoText } from './HardShadow';

type CatalogCardProps = {
	readonly eyebrow?: ReactNode;
	readonly soldOutLabel?: ReactNode;
	readonly promo?: boolean;
	readonly promoLabel?: string;
	readonly image: ReactNode;
	readonly title: ReactNode;
	readonly description?: ReactNode;
	readonly price?: ReactNode;
	readonly priceToggle?: ReactNode;
	readonly action?: ReactNode;
};

export const CatalogCard = ({
	eyebrow,
	soldOutLabel,
	promo = false,
	promoLabel = 'PROMO',
	image,
	title,
	description,
	price,
	priceToggle,
	action,
}: CatalogCardProps) => (
	<HardShadow
		sx={{
			bgcolor: 'background.paper',
			display: 'flex',
			flexDirection: 'column',
			height: '100%',
			minWidth: 0,
			...(promo
				? {
						borderColor: 'error.main',
						boxShadow: (theme) => `6px 6px 0 0 ${theme.palette.error.main}`,
					}
				: {}),
		}}
	>
		<Box
			sx={{
				borderBottom: '2px solid',
				borderColor: promo ? 'error.main' : 'ink.main',
				p: 1,
				px: 2,
				display: 'flex',
				justifyContent: 'space-between',
				bgcolor: 'surface.muted',
			}}
		>
			<Typography
				sx={{
					fontFamily: '"Space Mono", monospace',
					fontSize: '0.875rem',
					color: 'primary.main',
				}}
			>
				{eyebrow}
			</Typography>
			{soldOutLabel != null && soldOutLabel !== false && (
				<Typography
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.75rem',
						color: 'error.main',
						fontWeight: 700,
					}}
				>
					{soldOutLabel}
				</Typography>
			)}
		</Box>

		<Box
			sx={{
				p: { xs: 2, sm: 3 },
				flexGrow: 1,
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
				minWidth: 0,
			}}
		>
			<Box
				sx={{
					aspectRatio: '1/1',
					bgcolor: 'surface.chip',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: '1px solid',
					borderColor: 'divider',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{promo && (
					<Chip
						label={promoLabel}
						size='small'
						sx={{
							position: 'absolute',
							top: 8,
							right: 8,
							zIndex: 1,
							bgcolor: 'error.main',
							color: 'error.contrastText',
							fontFamily: '"Space Mono", monospace',
							fontWeight: 700,
							fontSize: '0.6875rem',
							letterSpacing: '0.08em',
							borderRadius: 0,
							height: 24,
						}}
					/>
				)}
				{image}
			</Box>

			<Box sx={{ minWidth: 0 }}>
				<Typography
					variant='h3'
					sx={{
						fontSize: { xs: '1.0625rem', sm: '1.25rem' },
						lineHeight: 1.2,
						textTransform: 'uppercase',
						overflowWrap: 'anywhere',
						color: promo ? 'error.main' : 'inherit',
					}}
				>
					{title}
				</Typography>
				{description != null && (
					<Box sx={{ mt: 1 }}>
						{typeof description === 'string' ? (
							<MonoText sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
								{description}
							</MonoText>
						) : (
							description
						)}
					</Box>
				)}
			</Box>
		</Box>

		{(price != null || priceToggle != null || action != null) && (
			<Box
				sx={{
					p: 2,
					px: { xs: 2, sm: 3 },
					borderTop: '2px solid',
					borderColor: promo ? 'error.main' : 'ink.main',
					mt: 'auto',
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
					minWidth: 0,
				}}
			>
				{(price != null || priceToggle != null) && (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 1,
							flexWrap: 'wrap',
							minWidth: 0,
						}}
					>
						{price != null && (
							<Typography
								sx={{
									fontFamily: '"Space Mono", monospace',
									fontSize: { xs: '1rem', sm: '1.125rem' },
									fontWeight: 700,
									color: promo ? 'error.main' : 'inherit',
									minWidth: 0,
								}}
							>
								{price}
							</Typography>
						)}
						{priceToggle}
					</Box>
				)}
				{action}
			</Box>
		)}
	</HardShadow>
);
