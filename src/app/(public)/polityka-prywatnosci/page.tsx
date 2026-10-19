import { staticPageMetadata } from '@seo/pageMetadata';
import { getPrivacyPolicy } from '@services/privacyPolicy';
import { PolitykaPrywatnosciView } from '@views/PolitykaPrywatnosci/PolitykaPrywatnosciView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('privacyPolicy');
export const revalidate = 300;

export default async function PolitykaPrywatnosciPage() {
	const privacyResult = await Promise.allSettled([getPrivacyPolicy()]);
	const initialPrivacyPolicy =
		privacyResult[0].status === 'fulfilled'
			? serializeForClient(privacyResult[0].value)
			: undefined;

	return <PolitykaPrywatnosciView initialPrivacyPolicy={initialPrivacyPolicy} />;
}
