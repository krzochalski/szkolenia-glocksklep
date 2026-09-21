import { staticPageMetadata } from '@seo/pageMetadata';
import { SciezkaRozwojuView } from '@views/SciezkaRozwoju/SciezkaRozwojuView';

export const metadata = staticPageMetadata('sciezkaRozwoju');

export default function SciezkaRozwojuPage() {
	return <SciezkaRozwojuView />;
}
