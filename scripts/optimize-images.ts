/**
 * Automated image pipeline (runs from `pnpm build` / `optimize-images`).
 *
 * 1. Convert public PNG/JPG content images → WebP (skip favicons)
 * 2. Emit responsive WebP variants for configured hero folders
 * 3. Write `src/generated/responsiveImages.ts` for OptimizedImage
 * 4. Rewrite `src/**` string literals from .png/.jpg → .webp when WebP exists
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';

import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const SRC_DIR = join(ROOT, 'src');
const GENERATED_DIR = join(SRC_DIR, 'generated');
const MANIFEST_PATH = join(GENERATED_DIR, 'responsiveImages.ts');

const MAX_SIZE_BYTES = 200 * 1024;
const INITIAL_QUALITY = 82;
const MIN_QUALITY = 60;
const QUALITY_STEP = 5;
const RESPONSIVE_WIDTHS = [640, 1024, 1920];

/** Folders under public/ that get responsive variants + default sizes. */
const HERO_FOLDERS: Record<string, string> = {
	hero: '100vw',
};

/** Optional per-file sizes overrides (public URL path → sizes). */
const HERO_SIZES_OVERRIDES: Record<string, string> = {};

const SKIP_NAME_PATTERN =
	/^(favicon|apple-touch-icon|mask-icon|android-chrome|mstile|pwa-)/i;

const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

type OptimizationResult = {
	file: string;
	originalSize: number;
	outputSize: number;
	quality: number;
};

type ResponsiveEntry = {
	src: string;
	srcSet: string;
	sizes: string;
};

function toPosix(path: string): string {
	return path.split(sep).join('/');
}

function publicUrl(absPath: string): string {
	return `/${toPosix(relative(PUBLIC_DIR, absPath))}`;
}

function shouldSkipSource(filePath: string): boolean {
	const name = basename(filePath);
	if (SKIP_NAME_PATTERN.test(name)) {
		return true;
	}
	if (name.endsWith('.ico')) {
		return true;
	}
	return false;
}

function findFiles(dir: string, extensions: Set<string>): string[] {
	const results: string[] = [];
	if (!existsSync(dir)) {
		return results;
	}

	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...findFiles(fullPath, extensions));
			continue;
		}
		if (extensions.has(extname(entry.name).toLowerCase())) {
			results.push(fullPath);
		}
	}

	return results;
}

async function encodeWebP(
	inputPath: string,
	resizeWidth?: number
): Promise<{
	buffer: Buffer;
	quality: number;
}> {
	let quality = INITIAL_QUALITY;
	const pipeline = () => {
		const img = sharp(inputPath);
		return (resizeWidth ? img.resize(resizeWidth) : img).webp({ quality }).toBuffer();
	};

	let buffer = await pipeline();
	while (buffer.length > MAX_SIZE_BYTES && quality - QUALITY_STEP >= MIN_QUALITY) {
		quality -= QUALITY_STEP;
		buffer = await pipeline();
	}

	return { buffer, quality };
}

async function convertToWebP(inputPath: string): Promise<OptimizationResult | null> {
	if (shouldSkipSource(inputPath)) {
		return null;
	}

	const outputPath = inputPath.replace(/\.(png|jpe?g)$/i, '.webp');
	const stats = statSync(inputPath);
	const { buffer, quality } = await encodeWebP(inputPath);
	await sharp(buffer).toFile(outputPath);

	if (buffer.length > MAX_SIZE_BYTES) {
		console.warn(
			`  WARN ${publicUrl(inputPath)} still ${(buffer.length / 1024).toFixed(1)}KB at q${quality}`
		);
	}

	return {
		file: inputPath,
		originalSize: stats.size,
		outputSize: buffer.length,
		quality,
	};
}

async function generateResponsiveVariants(
	inputPath: string,
	sizes: string
): Promise<ResponsiveEntry | null> {
	if (shouldSkipSource(inputPath)) {
		return null;
	}

	const name = basename(inputPath, extname(inputPath));
	const dir = dirname(inputPath);
	const metadata = await sharp(inputPath).metadata();
	const originalWidth = metadata.width ?? 1920;
	const srcParts: string[] = [];

	for (const width of RESPONSIVE_WIDTHS) {
		if (width >= originalWidth) {
			continue;
		}
		const variantPath = join(dir, `${name}-${width}w.webp`);
		const { buffer, quality } = await encodeWebP(inputPath, width);
		await sharp(buffer).toFile(variantPath);
		srcParts.push(`${publicUrl(variantPath)} ${width}w`);

		if (buffer.length > MAX_SIZE_BYTES) {
			console.warn(
				`  WARN ${publicUrl(variantPath)} still ${(buffer.length / 1024).toFixed(1)}KB at q${quality}`
			);
		}
	}

	const fullPath = join(dir, `${name}.webp`);
	const { buffer } = await encodeWebP(inputPath);
	await sharp(buffer).toFile(fullPath);
	srcParts.push(`${publicUrl(fullPath)} ${originalWidth}w`);

	const src = publicUrl(fullPath);
	return {
		src,
		srcSet: srcParts.join(', '),
		sizes,
	};
}

function quote(value: string): string {
	return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function writeManifest(entries: ResponsiveEntry[]): void {
	mkdirSync(GENERATED_DIR, { recursive: true });

	const lines = entries.map((entry) => {
		return `\t${quote(entry.src)}: {\n\t\tsrc: ${quote(entry.src)},\n\t\tsrcSet: ${quote(entry.srcSet)},\n\t\tsizes: ${quote(entry.sizes)},\n\t},`;
	});

	const body = `/**
 * Auto-generated by scripts/optimize-images.ts — do not edit by hand.
 */
export type ResponsiveImage = {
	readonly src: string;
	readonly srcSet: string;
	readonly sizes: string;
};

export const responsiveImages: Readonly<Record<string, ResponsiveImage>> = {
${lines.join('\n')}
} as const;
`;

	writeFileSync(MANIFEST_PATH, `${body}\n`, 'utf8');
	console.log(`  Wrote ${toPosix(relative(ROOT, MANIFEST_PATH))} (${entries.length} entries)`);
}

function rewriteSourceRefs(): number {
	const files = findFiles(SRC_DIR, CODE_EXT).filter(
		(file) => !file.includes(`${sep}generated${sep}`)
	);
	const pathPattern = /(['"`])(\/(?:[^'"`\s]+))\.(png|jpe?g)\1/gi;
	let rewriteCount = 0;

	for (const file of files) {
		const original = readFileSync(file, 'utf8');
		const next = original.replace(pathPattern, (match, quoteChar: string, pathNoExt: string) => {
			const webpAbs = join(PUBLIC_DIR, `${pathNoExt.slice(1)}.webp`);
			if (!existsSync(webpAbs)) {
				return match;
			}
			rewriteCount += 1;
			return `${quoteChar}${pathNoExt}.webp${quoteChar}`;
		});

		if (next !== original) {
			writeFileSync(file, next, 'utf8');
			console.log(`  Rewrote refs in ${toPosix(relative(ROOT, file))}`);
		}
	}

	return rewriteCount;
}

async function main(): Promise<void> {
	console.log('Image optimization pipeline');
	console.log('===========================\n');

	const allImages = findFiles(PUBLIC_DIR, SOURCE_EXT);
	console.log(`Found ${allImages.length} PNG/JPG under public/\n`);

	console.log('--- WebP conversion ---');
	const results: OptimizationResult[] = [];
	for (const imagePath of allImages) {
		const result = await convertToWebP(imagePath);
		if (!result) {
			continue;
		}
		results.push(result);
		const savings = (
			((result.originalSize - result.outputSize) / result.originalSize) *
			100
		).toFixed(1);
		console.log(
			`  ${publicUrl(imagePath)} → webp q${result.quality} | ${(result.originalSize / 1024).toFixed(0)}KB → ${(result.outputSize / 1024).toFixed(0)}KB (${savings}%)`
		);
	}
	console.log(`Converted ${results.length} images\n`);

	console.log('--- Responsive variants ---');
	const responsiveEntries: ResponsiveEntry[] = [];
	for (const [folder, sizes] of Object.entries(HERO_FOLDERS)) {
		const heroDir = join(PUBLIC_DIR, folder);
		const heroImages = findFiles(heroDir, SOURCE_EXT);
		for (const heroImage of heroImages) {
			const url = publicUrl(heroImage);
			const webpUrl = url.replace(/\.(png|jpe?g)$/i, '.webp');
			const resolvedSizes =
				HERO_SIZES_OVERRIDES[url] ?? HERO_SIZES_OVERRIDES[webpUrl] ?? sizes;
			console.log(`  Variants for ${url}`);
			const entry = await generateResponsiveVariants(heroImage, resolvedSizes);
			if (entry) {
				responsiveEntries.push(entry);
			}
		}
	}
	writeManifest(responsiveEntries);
	console.log('');

	console.log('--- Source rewrite (.png/.jpg → .webp) ---');
	const rewrites = rewriteSourceRefs();
	console.log(`Updated ${rewrites} string literal(s)\n`);

	console.log('===========================');
	console.log('Image optimization complete');
	const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
	const totalOptimized = results.reduce((sum, r) => sum + r.outputSize, 0);
	if (totalOriginal > 0) {
		const totalSavings = (
			((totalOriginal - totalOptimized) / totalOriginal) *
			100
		).toFixed(1);
		console.log(
			`Savings: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalOptimized / 1024 / 1024).toFixed(2)}MB (${totalSavings}%)`
		);
	}
}

main().catch((error: unknown) => {
	console.error('Image optimization failed:', error);
	process.exit(1);
});
