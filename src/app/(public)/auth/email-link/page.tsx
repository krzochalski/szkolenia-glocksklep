import { staticPageMetadata } from '@seo/pageMetadata';
import { EmailLinkView } from '@views/Auth/EmailLinkView';
import { Suspense } from 'react';

export const metadata = staticPageMetadata('auth');

export default function EmailLinkPage() {
	return (
		<Suspense fallback={null}>
			<EmailLinkView />
		</Suspense>
	);
}
