import { JsonLd } from '@components/JsonLd';
import { STATIC_SEO } from '@constants/seo';
import { collectionJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { SzkoleniaListView } from '@views/Szkolenia/SzkoleniaListView';

export const metadata = staticPageMetadata('courses');

export default function SzkoleniaPage() {
	return (
		<>
			<JsonLd
				data={collectionJsonLd({
					name: STATIC_SEO.courses.title,
					path: STATIC_SEO.courses.path,
					description: STATIC_SEO.courses.description,
				})}
			/>
			<SzkoleniaListView />
		</>
	);
}
