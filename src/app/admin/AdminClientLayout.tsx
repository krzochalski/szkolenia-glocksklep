'use client';

import { AdminShell } from '@components';
import { AdminGate } from '@views/Admin/AdminGate';
import type { ReactNode } from 'react';

export const AdminClientLayout = ({ children }: { readonly children: ReactNode }) => (
	<AdminGate>
		<AdminShell>{children}</AdminShell>
	</AdminGate>
);
