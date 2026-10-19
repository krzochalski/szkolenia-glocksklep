import { staticPageMetadata } from '@seo/pageMetadata';
import { getRegulamin } from '@services/regulamin';
import { RegulaminView } from '@views/Regulamin/RegulaminView';
import { serializeForClient } from '@/utils/serializeForClient';

export const metadata = staticPageMetadata('regulamin');
export const revalidate = 300;

export default async function RegulaminPage() {
	const regulaminResult = await Promise.allSettled([getRegulamin()]);
	const initialRegulamin =
		regulaminResult[0].status === 'fulfilled'
			? serializeForClient(regulaminResult[0].value)
			: undefined;

	return <RegulaminView initialRegulamin={initialRegulamin} />;
}
