import { PrzypomnijHasloView } from '@views/Auth/PrzypomnijHasloView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Przypomnij hasło',
};

export default function PrzypomnijHasloPage() {
	return <PrzypomnijHasloView />;
}
