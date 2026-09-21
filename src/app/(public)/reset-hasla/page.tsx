import { ResetHaslaView } from '@views/Auth/ResetHaslaView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Reset hasła',
};

export default function ResetHaslaPage() {
	return (
		<Suspense>
			<ResetHaslaView />
		</Suspense>
	);
}
