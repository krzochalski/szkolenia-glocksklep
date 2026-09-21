import { staticPageMetadata } from '@seo/pageMetadata';
import { LoginView } from '@views/Auth/LoginView';
import { Suspense } from 'react';

export const metadata = staticPageMetadata('login');

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginView />
		</Suspense>
	);
}
