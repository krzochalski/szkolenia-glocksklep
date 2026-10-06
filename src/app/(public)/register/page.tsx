import { staticPageMetadata } from '@seo/pageMetadata';
import { RegisterView } from '@views/Auth/RegisterView';
import { Suspense } from 'react';

export const metadata = staticPageMetadata('register');

export default function RegisterPage() {
	return (
		<Suspense fallback={null}>
			<RegisterView />
		</Suspense>
	);
}
