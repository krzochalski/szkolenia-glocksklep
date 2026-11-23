import { WaitlistUnsubscribeView } from '@views/Waitlist/WaitlistUnsubscribeView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Wypisz z listy oczekujących',
	robots: { index: false, follow: false },
};

type Props = {
	searchParams: Promise<{ token?: string }>;
};

export default async function WaitlistUnsubscribePage({ searchParams }: Props) {
	const { token } = await searchParams;
	return <WaitlistUnsubscribeView token={token ?? ''} />;
}
