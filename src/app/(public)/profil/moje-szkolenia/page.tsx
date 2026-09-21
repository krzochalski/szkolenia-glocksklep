import { MojeSzkoleniaView } from '@views/Profil/MojeSzkoleniaView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Moje szkolenia',
};

export default function MojeSzkoleniaPage() {
	return <MojeSzkoleniaView />;
}
