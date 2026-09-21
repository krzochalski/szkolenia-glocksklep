import type { ReactNode } from 'react';
import { Box, Chip, Typography } from '../primitives';
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
}: CatalogCardProps) => {
	const soldOut = soldOutLabel != null && soldOutLabel !== false;
	const showHeader = eyebrow != null && eyebrow !== false && eyebrow !== '';
	const emphasized = promo && !soldOut;

	return (
		<HardShadow
			sx={{
				bgcolor: 'background.paper',
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				minWidth: 0,
				position: 'relative',
				...(soldOut
					? {
							filter: 'grayscale(1)',
							overflow: 'hidden',
							borderColor: 'text.secondary',
							boxShadow: (theme) => `6px 6px 0 0 ${theme.palette.text.secondary}`,
						}
					: {}),
				...(emphasized
					? {
							borderColor: 'error.main',
							boxShadow: (theme) => `6px 6px 0 0 ${theme.palette.error.main}`,
						}
					: {}),
			}}
		>
			{showHeader && (
				<Box
					sx={{
						borderBottom: '2px solid',
						borderColor: emphasized ? 'error.main' : 'ink.main',
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
				</Box>
			)}

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
					{emphasized && (
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
					{soldOut && (
						<Box
							sx={{
								position: 'absolute',
								left: '50%',
								top: '50%',
								transform: 'translate(-50%, -50%)',
								zIndex: 3,
								px: 1.5,
								py: 0.75,
								bgcolor: 'background.paper',
								border: '2px solid',
								borderColor: 'text.secondary',
								pointerEvents: 'none',
							}}
						>
							<Typography
								sx={{
									fontFamily: '"Space Mono", monospace',
									fontSize: '0.75rem',
									fontWeight: 700,
									letterSpacing: '0.12em',
									color: 'text.secondary',
									lineHeight: 1,
								}}
							>
								{soldOutLabel}
							</Typography>
						</Box>
					)}
				</Box>

				<Box sx={{ minWidth: 0 }}>
					<Typography
						variant='h3'
						sx={{
							fontSize: { xs: '1.0625rem', sm: '1.25rem' },
							lineHeight: 1.2,
							textTransform: 'uppercase',
							overflowWrap: 'anywhere',
							color: emphasized ? 'error.main' : 'inherit',
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
						borderColor: emphasized ? 'error.main' : soldOut ? 'text.secondary' : 'ink.main',
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
										color: emphasized ? 'error.main' : 'inherit',
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
			{soldOut && (
				<Box
					aria-hidden
					sx={{
						position: 'absolute',
						inset: 0,
						zIndex: 2,
						pointerEvents: 'none',
						background: (theme) => {
							const line = theme.palette.text.secondary;
							return `linear-gradient(to top right, transparent calc(50% - 1.5px), ${line} calc(50% - 1.5px), ${line} calc(50% + 1.5px), transparent calc(50% + 1.5px))`;
						},
					}}
				/>
			)}
		</HardShadow>
	);
};
