import type { NextRequest } from 'next/server';

import { proxyFunctionsApi } from '@/server/proxyFunctionsApi';

type RouteContext = { params: Promise<{ path: string[] }> };

const handle = async (req: NextRequest, context: RouteContext) => {
	const { path } = await context.params;
	return proxyFunctionsApi(req, path);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
