import { staticPageMetadata } from '@seo/pageMetadata';
import { RegulaminView } from '@views/Regulamin/RegulaminView';

export const metadata = staticPageMetadata('regulamin');

export default function RegulaminPage() {
	return <RegulaminView />;
}
