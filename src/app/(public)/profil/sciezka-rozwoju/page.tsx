import { ProfilSciezkaRozwojuView } from '@views/Profil/ProfilSciezkaRozwojuView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Ścieżka rozwoju',
};

export default function ProfilSciezkaRozwojuPage() {
	return <ProfilSciezkaRozwojuView />;
}
