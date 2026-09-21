import { staticPageMetadata } from '@seo/pageMetadata';
import { KontaktView } from '@views/Kontakt/KontaktView';

export const metadata = staticPageMetadata('contact');

export default function KontaktPage() {
	return <KontaktView />;
}
