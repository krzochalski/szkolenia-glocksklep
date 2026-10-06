import { KontoUtworzoneView } from '@views/Auth/KontoUtworzoneView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Konto utworzone',
};

export default function KontoUtworzonePage() {
	return (
		<Suspense fallback={null}>
			<KontoUtworzoneView />
		</Suspense>
	);
}
