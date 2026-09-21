'use client';

import { ProfilShell } from '@components';
import type { ReactNode } from 'react';

export default function ProfilLayout({ children }: { readonly children: ReactNode }) {
	return <ProfilShell>{children}</ProfilShell>;
}
