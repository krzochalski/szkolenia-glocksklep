'use client';

import { AdminShell } from '@components';
import { AdminGate } from '@views/Admin/AdminGate';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { readonly children: ReactNode }) {
	return (
		<AdminGate>
			<AdminShell>{children}</AdminShell>
		</AdminGate>
	);
}
