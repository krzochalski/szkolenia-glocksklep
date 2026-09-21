import { JsonLd } from '@components/JsonLd';
import { homeJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { HomeView } from '@views/Home/HomeView';

export const metadata = staticPageMetadata('home');

export default function HomePage() {
	return (
		<>
			<JsonLd data={homeJsonLd()} />
			<HomeView />
		</>
	);
}
