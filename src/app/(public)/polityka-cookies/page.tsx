import { CATALOG_REVALIDATE_SECONDS, staticPageMetadata } from '@seo/pageMetadata';
import { getCookiesPolicy } from '@services/cookiesPolicy';
import { PolitykaCookiesView } from '@views/PolitykaCookies/PolitykaCookiesView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('cookiesPolicy');
export const revalidate = CATALOG_REVALIDATE_SECONDS;

export default async function PolitykaCookiesPage() {
	const cookiesResult = await Promise.allSettled([getCookiesPolicy()]);
	const initialCookiesPolicy =
		cookiesResult[0].status === 'fulfilled'
			? serializeForClient(cookiesResult[0].value)
			: undefined;

	return <PolitykaCookiesView initialCookiesPolicy={initialCookiesPolicy} />;
}
