import { staticPageMetadata } from '@seo/pageMetadata';
import { ProfilSciezkaRozwojuView } from '@views/Profil/ProfilSciezkaRozwojuView';

export const metadata = staticPageMetadata('profil', '/profil/sciezka-rozwoju');

export default function ProfilSciezkaRozwojuPage() {
	return <ProfilSciezkaRozwojuView />;
}
