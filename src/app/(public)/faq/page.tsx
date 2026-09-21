import { staticPageMetadata } from '@seo/pageMetadata';
import { FaqView } from '@views/Faq/FaqView';

export const metadata = staticPageMetadata('faq');

export default function FaqPage() {
	return <FaqView />;
}
