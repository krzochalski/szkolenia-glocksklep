import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = () => {
	const buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID ?? 'unknown';
	return NextResponse.json(
		{ buildId },
		{
			headers: {
				'Cache-Control': 'no-store, max-age=0',
			},
		}
	);
};
