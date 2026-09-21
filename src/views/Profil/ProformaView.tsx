'use client';

import { useAuthUser } from '@hooks';
import { getBillingDataByInstructorSlug } from '@services/billingData';
import { getCourseBySlug } from '@services/courses';
import { buildProformaFromBilling } from '@services/proformaInvoices';
import { Box, CircularProgress, Paper, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';

type Props = {
	readonly slug: string;
	readonly dateId: string;
};

export const ProformaView = ({ slug, dateId }: Props) => {
	const user = useAuthUser();

	const { data: course, isLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
	});

	const date = course?.dates?.find((d) => d.id === dateId);
	const instructorSlug = date?.instructor?.slug ?? '';

	const { data: billing } = useQuery({
		queryKey: ['billing', instructorSlug],
		queryFn: () => getBillingDataByInstructorSlug(instructorSlug),
		enabled: Boolean(instructorSlug),
	});

	if (isLoading || !course || !date || !billing) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	const participant = date.participants?.find((p) => p.id === user?.uid);
	const invoice = buildProformaFromBilling(course, date, billing, {
		displayName: participant?.name ?? user?.displayName ?? undefined,
		email: participant?.email ?? user?.email ?? undefined,
		paid: participant?.paid,
	});

	return (
		<Paper variant='outlined' sx={{ p: 3, maxWidth: 640 }}>
			<Typography variant='h5' gutterBottom>
				Proforma {invoice.number}
			</Typography>
			<Typography variant='body2' color='text.secondary' gutterBottom>
				{invoice.issuePlace} · wystawiono {invoice.issueDate} · termin {invoice.dueDate}
			</Typography>
			<Typography sx={{ mt: 2, fontWeight: 700 }}>
				Sprzedawca
			</Typography>
			<Typography variant='body2'>
				{invoice.seller.name}
				<br />
				{invoice.seller.address}, {invoice.seller.city}
				<br />
				NIP: {invoice.seller.nip}
			</Typography>
			<Typography sx={{ mt: 2, fontWeight: 700 }}>
				Usługa
			</Typography>
			<Typography variant='body2'>
				{invoice.serviceName}
				<br />
				Netto: {invoice.amountNet.toFixed(2)} zł · VAT {invoice.vatRate}%:{' '}
				{invoice.amountVat.toFixed(2)} zł · Brutto: {invoice.amountGross.toFixed(2)} zł
			</Typography>
			<Typography sx={{ mt: 2, fontWeight: 700 }}>
				Płatność
			</Typography>
			<Typography variant='body2'>
				{invoice.paymentMethod}
				<br />
				{invoice.seller.bankName}: {invoice.seller.bankAccount}
				<br />
				Status: {invoice.status === 'paid' ? 'opłacona' : 'nieopłacona'}
			</Typography>
		</Paper>
	);
};
