/** Rewrite public PNG/JPG paths to WebP (optimize-images output). */
export const toOptimizedImagePath = (src: string): string =>
	src.trim().replace(/\.(png|jpe?g)$/i, '.webp');
