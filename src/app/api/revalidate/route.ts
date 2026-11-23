import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { Paths } from '@constants/paths';

export const dynamic = 'force-dynamic';

const DEFAULT_PATHS = [
	Paths.home,
	Paths.najblizszeSzkolenia,
	Paths.courses,
	Paths.sciezkaRozwoju,
] as const;

const bodySchema = z.object({
	paths: z.array(z.string().min(1)).optional(),
	/** When set, also revalidate `/szkolenia/{slug}`. */
	slug: z.string().min(1).optional(),
});

const isAuthorized = (req: Request): boolean => {
	const secret = process.env.REVALIDATE_SECRET?.trim();
	if (!secret) return false;
	const header = req.headers.get('x-revalidate-secret')?.trim();
	return Boolean(header && header === secret);
};

export const POST = async (req: Request) => {
	if (!process.env.REVALIDATE_SECRET?.trim()) {
		return NextResponse.json({ error: 'Revalidate not configured.' }, { status: 503 });
	}
	if (!isAuthorized(req)) {
		return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
	}

	let paths: string[] = [...DEFAULT_PATHS];
	try {
		const json: unknown = await req.json().catch(() => ({}));
		const parsed = bodySchema.safeParse(json);
		if (parsed.success) {
			if (parsed.data.paths?.length) {
				paths = parsed.data.paths;
			}
			if (parsed.data.slug) {
				paths = [...paths, Paths.coursePage.replace('$slug', parsed.data.slug)];
			}
		}
	} catch {
		/* use defaults */
	}

	const unique = [...new Set(paths)];
	for (const path of unique) {
		revalidatePath(path);
	}

	return NextResponse.json(
		{ ok: true, revalidated: unique },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
};
