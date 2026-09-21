import { KontoUtworzoneView } from '@views/Auth/KontoUtworzoneView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Konto utworzone',
};

export default function KontoUtworzonePage() {
	return <KontoUtworzoneView />;
}
