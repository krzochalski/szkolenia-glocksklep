import { Box } from '../primitives';
import { useState } from 'react';

type ImageGalleryProps = {
	readonly images: readonly string[];
	readonly alt: string;
	readonly objectFit?: 'cover' | 'contain';
	/** Multiply blend used on trigger product hero */
	readonly mixBlendMultiply?: boolean;
	/** Main frame aspect; omit to fill parent height */
	readonly aspectRatio?: string | number;
};

export const ImageGallery = ({
	images,
	alt,
	objectFit = 'cover',
	mixBlendMultiply = false,
	aspectRatio = '1/1',
}: ImageGalleryProps) => {
	const list = images.filter(Boolean);
	const [active, setActive] = useState(0);
	const safeActive = list.length === 0 ? 0 : Math.min(active, list.length - 1);
	const current = list[safeActive] ?? '';
	const showThumbs = list.length > 1;

	if (!current) return null;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', height: '100%' }}>
			<Box
				sx={{
					position: 'relative',
					aspectRatio: aspectRatio || undefined,
					flex: aspectRatio ? undefined : 1,
					minHeight: aspectRatio ? undefined : 200,
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
				}}
			>
				<Box
					component='img'
					src={current}
					alt={alt}
					loading='lazy'
					decoding='async'
					sx={{
						width: '100%',
						height: '100%',
						objectFit,
						mixBlendMode: mixBlendMultiply ? 'multiply' : undefined,
						transition: 'transform 0.7s ease',
						'&:hover': { transform: 'scale(1.05)' },
					}}
				/>
			</Box>

			{showThumbs && (
				<Box
					sx={{
						display: 'flex',
						gap: 1,
						flexWrap: 'wrap',
						flexShrink: 0,
					}}
					role='list'
					aria-label='Gallery'
				>
					{list.map((src, index) => {
						const selected = index === safeActive;
						return (
							<Box
								key={src}
								component='button'
								type='button'
								role='listitem'
								aria-label={`Image ${index + 1}`}
								aria-current={selected ? 'true' : undefined}
								onClick={() => setActive(index)}
								sx={{
									p: 0,
									m: 0,
									width: 64,
									height: 64,
									border: '2px solid',
									borderColor: selected ? 'primary.main' : 'ink.main',
									bgcolor: 'background.paper',
									cursor: 'pointer',
									overflow: 'hidden',
									flexShrink: 0,
									opacity: selected ? 1 : 0.75,
									'&:hover': { opacity: 1 },
								}}
							>
								<Box
									component='img'
									src={src}
									alt=''
									loading='lazy'
									decoding='async'
									sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
								/>
							</Box>
						);
					})}
				</Box>
			)}
		</Box>
	);
};
