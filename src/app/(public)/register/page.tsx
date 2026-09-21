import { staticPageMetadata } from '@seo/pageMetadata';
import { RegisterView } from '@views/Auth/RegisterView';

export const metadata = staticPageMetadata('register');

export default function RegisterPage() {
	return <RegisterView />;
}
