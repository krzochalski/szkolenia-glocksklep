import { staticPageMetadata } from '@seo/pageMetadata';
import { ONasView } from '@views/ONas/ONasView';

export const metadata = staticPageMetadata('about');

export default function ONasPage() {
	return <ONasView />;
}
