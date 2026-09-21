import { LoginView } from '@views/Auth/LoginView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Admin — logowanie',
	robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
	return (
		<Suspense>
			<LoginView />
		</Suspense>
	);
}
