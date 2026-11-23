import type { ReactNode } from 'react';

/** Avoid year-long CDN HTML shells for the account SPA. */
export const dynamic = 'force-dynamic';

export default function ProfilLayout({ children }: { readonly children: ReactNode }) {
	return children;
}
