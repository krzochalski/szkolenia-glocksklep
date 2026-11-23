import type { ReactNode } from 'react';

import { AdminClientLayout } from './AdminClientLayout';

/** Avoid year-long CDN HTML shells for the admin SPA. */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { readonly children: ReactNode }) {
	return <AdminClientLayout>{children}</AdminClientLayout>;
}
