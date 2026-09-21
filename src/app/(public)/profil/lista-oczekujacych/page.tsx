import { ListaOczekujacychView } from '@views/Profil/ListaOczekujacychView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Lista oczekujących',
};

export default function ListaOczekujacychPage() {
	return <ListaOczekujacychView />;
}
