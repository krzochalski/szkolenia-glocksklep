import { JsonLd } from '@components/JsonLd';
import { faqPageJsonLd } from '@seo/jsonLd';
import { staticPageMetadata } from '@seo/pageMetadata';
import { getFaqItems } from '@services/faq';
import { FaqView } from '@views/Faq/FaqView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('faq');
export const revalidate = 300;

export default async function FaqPage() {
	const faqResult = await Promise.allSettled([getFaqItems()]);
	const initialItems =
		faqResult[0].status === 'fulfilled' ? serializeForClient(faqResult[0].value) : undefined;

	const jsonLd =
		initialItems && initialItems.length > 0
			? faqPageJsonLd(
					initialItems.map((item) => ({
						title: item.question,
						content: item.answer,
					}))
				)
			: null;

	return (
		<>
			{jsonLd ? <JsonLd data={jsonLd} /> : null}
			<FaqView initialItems={initialItems} />
		</>
	);
}
