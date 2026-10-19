import { ProfilDebriefingListView } from '@views/Profil/ProfilDebriefingListView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Po szkoleniu',
	robots: { index: false, follow: false },
};

export default function ProfilDebriefingPage() {
	return <ProfilDebriefingListView />;
}
