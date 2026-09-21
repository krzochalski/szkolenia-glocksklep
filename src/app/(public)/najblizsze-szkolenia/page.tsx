import { JsonLd } from '@components/JsonLd';
import { STATIC_SEO } from '@constants/seo';
import { collectionJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { NajblizszeSzkoleniaView } from '@views/Szkolenia/NajblizszeSzkoleniaView';

export const metadata = staticPageMetadata('nearest');

export default function NajblizszePage() {
	return (
		<>
			<JsonLd
				data={collectionJsonLd({
					name: STATIC_SEO.nearest.title,
					path: STATIC_SEO.nearest.path,
					description: STATIC_SEO.nearest.description,
				})}
			/>
			<NajblizszeSzkoleniaView />
		</>
	);
}
