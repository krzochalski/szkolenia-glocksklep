import { JsonLd } from '@components/JsonLd';
import { ABOUT_CONTENT, ABOUT_PHOTO_SRC } from '@/data/aboutContent';
import { personJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { ONasView } from '@views/ONas/ONasView';

export const metadata = staticPageMetadata('about');
export const revalidate = 300;

export default function ONasPage() {
	return (
		<>
			<JsonLd
				data={personJsonLd({
					name: ABOUT_CONTENT.name,
					description: ABOUT_CONTENT.tagline,
					imagePath: ABOUT_PHOTO_SRC,
					email: ABOUT_CONTENT.email,
					sameAs: [ABOUT_CONTENT.instagram, ABOUT_CONTENT.youtube],
				})}
			/>
			<ONasView />
		</>
	);
}
