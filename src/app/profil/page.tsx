import { ProfilView } from '@views/Profil/ProfilView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Profil',
};

export default function ProfilPage() {
	return <ProfilView />;
}
