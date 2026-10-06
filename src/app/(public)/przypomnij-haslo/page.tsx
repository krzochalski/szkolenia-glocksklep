import { PrzypomnijHasloView } from '@views/Auth/PrzypomnijHasloView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Przypomnij hasło',
};

export default function PrzypomnijHasloPage() {
	return (
		<Suspense fallback={null}>
			<PrzypomnijHasloView />
		</Suspense>
	);
}
