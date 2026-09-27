import { Box, type BoxProps } from '@ui';

import { responsiveImages } from '@/generated/responsiveImages';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';

type OptimizedImageProps = Omit<BoxProps<'img'>, 'component' | 'src'> & {
	readonly src: string;
	readonly alt: string;
};

/**
 * Serves WebP `src`, and attaches generated `srcSet`/`sizes` when the
 * optimize-images pipeline produced responsive variants for this path.
 * Legacy `.png`/`.jpg` CMS paths are rewritten to `.webp`.
 */
export const OptimizedImage = ({ src, alt, sizes, srcSet, ...rest }: OptimizedImageProps) => {
	const optimizedSrc = toOptimizedImagePath(src);
	const meta = responsiveImages[optimizedSrc] ?? responsiveImages[src];

	return (
		<Box
			component='img'
			src={optimizedSrc}
			alt={alt}
			srcSet={srcSet ?? meta?.srcSet}
			sizes={sizes ?? meta?.sizes}
			decoding='async'
			{...rest}
		/>
	);
};
