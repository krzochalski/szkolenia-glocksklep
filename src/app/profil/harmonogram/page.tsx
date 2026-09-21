import { HarmonogramView } from '@views/Profil/HarmonogramView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Harmonogram',
};

export default function HarmonogramPage() {
	return <HarmonogramView />;
}
