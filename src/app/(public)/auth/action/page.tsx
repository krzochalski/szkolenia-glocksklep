import { staticPageMetadata } from '@seo/pageMetadata';
import { AuthActionView } from '@views/Auth/AuthActionView';
import { Suspense } from 'react';

export const metadata = staticPageMetadata('auth', '/auth/action');

export default function AuthActionPage() {
	return (
		<Suspense fallback={null}>
			<AuthActionView />
		</Suspense>
	);
}
