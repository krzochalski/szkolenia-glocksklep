'use client';

import { useAuthUser } from '@hooks';
import { getBillingDataByInstructorSlug } from '@services/billingData';
import { getCourseBySlug } from '@services/courses';
import { buildProformaFromBilling } from '@services/proformaInvoices';
import { getUserProfile } from '@services/users';
import { useQuery } from '@tanstack/react-query';
import {
	Box,
	Button,
	brand,
	Chip,
	CircularProgress,
	ContentSwap,
	Divider,
	HardShadow,
	MonoText,
	Price,
	Stack,
	Typography,
} from '@ui';
import { Download } from '@ui/icons';
import dayjs from 'dayjs';
import type { ProformaInvoice } from '@/types/proformaInvoice';
import { downloadProformaPdf } from '@/utils/downloadProformaPdf';
import { formatMoney } from '@/utils/pricing';
import 'dayjs/locale/pl';
import Image from 'next/image';
import { type ReactNode, type RefObject, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

type Props = {
	readonly slug: string;
	readonly dateId: string;
};

const formatDocDate = (iso: string): string => dayjs(iso).locale('pl').format('D MMMM YYYY');

const money = (n: number): string => `${formatMoney(n)} zł`;

const PartyBlock = ({ label, children }: { label: string; children: ReactNode }) => (
	<Box sx={{ minWidth: 0, flex: 1 }}>
		<MonoText sx={{ display: 'block', mb: 1, color: 'text.secondary', fontSize: 12 }}>
			{label}
		</MonoText>
		{children}
	</Box>
);

const MetaRow = ({ label, value }: { label: string; value: string }) => (
	<Box
		sx={{
			display: 'flex',
			justifyContent: 'space-between',
			gap: 2,
			py: 0.4,
		}}
	>
		<Typography variant='body2' color='text.secondary'>
			{label}
		</Typography>
		<Typography variant='body2' sx={{ fontWeight: 600, textAlign: 'right' }}>
			{value}
		</Typography>
	</Box>
);

const ProformaDocument = ({
	invoice,
	exporting,
	documentRef,
}: {
	invoice: ProformaInvoice;
	exporting: boolean;
	documentRef: RefObject<HTMLDivElement | null>;
}) => {
	const paid = invoice.status === 'paid';

	return (
		<HardShadow
			ref={documentRef}
			sx={{
				p: { xs: 2.5, sm: 4 },
				maxWidth: 800,
				bgcolor: 'background.paper',
				...(exporting
					? {
							boxShadow: 'none',
							width: '100%',
							maxWidth: 800,
							m: 0,
						}
					: null),
				'@media print': {
					boxShadow: 'none',
					border: '1px solid',
					borderColor: 'divider',
					width: '100%',
					maxWidth: '100%',
					m: 0,
				},
			}}
		>
			{/* Header: logo + title */}
			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					gap: 3,
					mb: 3,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Box
						sx={{
							width: 56,
							height: 56,
							flexShrink: 0,
							border: '2px solid',
							borderColor: 'ink.main',
							bgcolor: 'surface.muted',
							overflow: 'hidden',
						}}
					>
						<Image
							src='/brand/glocksklep-mark.webp'
							alt='Glocksklep'
							width={56}
							height={56}
							priority
							style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					</Box>
					<Box>
						<Typography sx={{ fontWeight: 800, letterSpacing: 0.02, lineHeight: 1.2 }}>
							GLOCKSKLEP
						</Typography>
						<MonoText sx={{ display: 'block', fontSize: 12, color: 'text.secondary' }}>
							Szkolenia
						</MonoText>
					</Box>
				</Box>

				<Box sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: 220 }}>
					<MonoText sx={{ display: 'block', color: 'primary.main', fontSize: 12, mb: 0.5 }}>
						Faktura proforma
					</MonoText>
					<Typography variant='h5' component='h1' sx={{ fontWeight: 800, lineHeight: 1.2 }}>
						{invoice.number}
					</Typography>
					<Chip
						size='small'
						label={paid ? 'Opłacona' : 'Nieopłacona'}
						color={paid ? 'success' : 'warning'}
						variant='outlined'
						sx={{ mt: 1, fontWeight: 700 }}
					/>
				</Box>
			</Box>

			{/* Meta dates */}
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
					gap: { xs: 0.5, sm: 3 },
					p: 2,
					mb: 3,
					bgcolor: 'surface.muted',
					border: '1px solid',
					borderColor: 'borderMuted.main',
				}}
			>
				<Box>
					<MetaRow label='Miejsce wystawienia' value={invoice.issuePlace} />
					<MetaRow label='Data wystawienia' value={formatDocDate(invoice.issueDate)} />
				</Box>
				<Box>
					<MetaRow label='Termin płatności' value={formatDocDate(invoice.dueDate)} />
					<MetaRow label='Forma płatności' value={invoice.paymentMethod} />
				</Box>
			</Box>

			{/* Parties */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					gap: 3,
					mb: 3,
				}}
			>
				<PartyBlock label='Sprzedawca'>
					<Typography sx={{ fontWeight: 700 }}>{invoice.seller.name}</Typography>
					<Typography variant='body2' color='text.secondary'>
						{invoice.seller.address}
						<br />
						{invoice.seller.city}
						<br />
						NIP: {invoice.seller.nip}
						{invoice.seller.phone ? (
							<>
								<br />
								Tel: {invoice.seller.phone}
							</>
						) : null}
						{invoice.seller.website ? (
							<>
								<br />
								{invoice.seller.website}
							</>
						) : null}
					</Typography>
				</PartyBlock>

				<Divider orientation='vertical' flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
				<Divider sx={{ display: { xs: 'block', sm: 'none' } }} />

				<PartyBlock label='Nabywca'>
					{invoice.buyer ? (
						<>
							<Typography sx={{ fontWeight: 700 }}>{invoice.buyer.name}</Typography>
							<Typography variant='body2' color='text.secondary'>
								{invoice.buyer.email ? (
									<>
										{invoice.buyer.email}
										<br />
									</>
								) : null}
								{invoice.buyer.phone ? (
									<>
										Tel: {invoice.buyer.phone}
										<br />
									</>
								) : null}
								{invoice.buyer.nip ? <>NIP: {invoice.buyer.nip}</> : null}
							</Typography>
						</>
					) : (
						<Typography variant='body2' color='text.secondary'>
							—
						</Typography>
					)}
				</PartyBlock>
			</Box>

			{/* Line items */}
			<MonoText sx={{ display: 'block', mb: 1, color: 'text.secondary', fontSize: 12 }}>
				Pozycje
			</MonoText>
			<Box
				sx={{
					border: '1px solid',
					borderColor: 'borderMuted.main',
					mb: 2,
					overflow: 'hidden',
				}}
			>
				<Box
					sx={{
						display: { xs: 'none', sm: 'grid' },
						gridTemplateColumns: '40px 1fr 72px 88px 72px 100px',
						gap: 1,
						px: 1.5,
						py: 1,
						bgcolor: 'surface.muted',
						borderBottom: '1px solid',
						borderColor: 'borderMuted.main',
					}}
				>
					{['Lp', 'Nazwa', 'Ilość', 'Netto', 'VAT', 'Brutto'].map((h) => (
						<Typography
							key={h}
							variant='caption'
							sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.04 }}
						>
							{h}
						</Typography>
					))}
				</Box>

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: '40px 1fr 72px 88px 72px 100px' },
						gap: { xs: 0.75, sm: 1 },
						alignItems: 'start',
						px: 1.5,
						py: 1.5,
					}}
				>
					<Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' } }}>
						1
					</Typography>
					<Typography variant='body2' sx={{ fontWeight: 700 }}>
						{invoice.serviceName}
					</Typography>
					<Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' } }}>
						1 szt.
					</Typography>
					<Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' } }}>
						{money(invoice.amountNet)}
					</Typography>
					<Typography variant='body2' sx={{ display: { xs: 'none', sm: 'block' } }}>
						{invoice.vatRate}%
					</Typography>
					<Typography
						variant='body2'
						sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}
					>
						{money(invoice.amountGross)}
					</Typography>

					{/* Mobile amounts */}
					<Stack spacing={0.25} sx={{ display: { xs: 'flex', sm: 'none' }, mt: 0.5 }}>
						<Typography variant='body2'>Ilość: 1 szt.</Typography>
						<Typography variant='body2'>Netto: {money(invoice.amountNet)}</Typography>
						<Typography variant='body2'>
							VAT {invoice.vatRate}%: {money(invoice.amountVat)}
						</Typography>
						<Typography variant='body2' sx={{ fontWeight: 700 }}>
							Brutto: {money(invoice.amountGross)}
						</Typography>
					</Stack>
				</Box>
			</Box>

			{/* Totals */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
					mb: 3,
				}}
			>
				<Box sx={{ width: '100%', maxWidth: 280 }}>
					<MetaRow label='Razem netto' value={money(invoice.amountNet)} />
					<MetaRow label={`VAT ${invoice.vatRate}%`} value={money(invoice.amountVat)} />
					<Divider sx={{ my: 1 }} />
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							gap: 2,
							py: 0.5,
						}}
					>
						<Typography sx={{ fontWeight: 800 }}>Do zapłaty</Typography>
						<Price
							gross={invoice.amountGross}
							net={invoice.amountNet}
							size='md'
							sx={{ alignItems: 'flex-end' }}
						/>
					</Box>
				</Box>
			</Box>

			{/* Payment */}
			<Box
				sx={{
					p: 2,
					border: '2px solid',
					borderColor: 'ink.main',
					bgcolor: paid ? brand.inkSoft : brand.primarySoft,
				}}
			>
				<MonoText sx={{ display: 'block', mb: 1.5, fontSize: 12 }}>Dane do przelewu</MonoText>
				<Stack spacing={1}>
					<MetaRow label='Odbiorca' value={invoice.seller.name} />
					<MetaRow label='Bank' value={invoice.seller.bankName} />
					<Box>
						<Typography variant='body2' color='text.secondary' gutterBottom>
							Numer konta (IBAN)
						</Typography>
						<Typography
							sx={{
								fontFamily: '"Space Mono", "Courier New", monospace',
								fontWeight: 700,
								fontSize: { xs: 13, sm: 15 },
								letterSpacing: 0.02,
								wordBreak: 'break-all',
							}}
						>
							{invoice.seller.bankAccount}
						</Typography>
					</Box>
					<Box>
						<Typography variant='body2' color='text.secondary' gutterBottom>
							Tytuł przelewu
						</Typography>
						<Typography sx={{ fontWeight: 700 }}>{invoice.paymentTitle}</Typography>
					</Box>
					<MetaRow label='Kwota' value={money(invoice.amountGross)} />
				</Stack>
			</Box>

			<Typography
				variant='caption'
				color='text.secondary'
				sx={{ display: 'block', mt: 2.5, lineHeight: 1.5 }}
			>
				Dokument informacyjny do zapłaty za udział w szkoleniu. Nie jest fakturą VAT. Status
				„opłacona” ustawia organizator po potwierdzeniu wpływu.
			</Typography>
		</HardShadow>
	);
};

export const ProformaView = ({ slug, dateId }: Props) => {
	const user = useAuthUser();
	const documentRef = useRef<HTMLDivElement | null>(null);
	const [exporting, setExporting] = useState(false);
	const [pdfError, setPdfError] = useState<string | null>(null);

	const { data: course, isLoading: courseLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
	});

	const date = course?.dates?.find((d) => d.id === dateId);
	const instructorSlug = date?.instructor?.slug ?? '';

	const { data: billing, isLoading: billingLoading } = useQuery({
		queryKey: ['billing', instructorSlug],
		queryFn: () => getBillingDataByInstructorSlug(instructorSlug),
		enabled: Boolean(instructorSlug),
	});

	const { data: profile, isLoading: profileLoading } = useQuery({
		queryKey: ['userProfile', user?.uid],
		queryFn: getUserProfile,
		enabled: Boolean(user),
	});

	const isLoading =
		courseLoading ||
		!course ||
		!date ||
		(Boolean(instructorSlug) && billingLoading) ||
		!billing ||
		(Boolean(user) && profileLoading);

	if (isLoading || !course || !date || !billing) {
		return (
			<ContentSwap state='loading'>
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			</ContentSwap>
		);
	}

	const participant = date.participants?.find((p) => p.id === user?.uid);
	const invoice = buildProformaFromBilling(
		course,
		date,
		billing,
		{
			displayName:
				participant?.name ??
				profile?.fullName ??
				profile?.displayName ??
				user?.displayName ??
				undefined,
			email: participant?.email ?? profile?.email ?? user?.email ?? undefined,
			phone: participant?.phoneNumber ?? profile?.phoneNumber ?? user?.phoneNumber ?? undefined,
			nip: profile?.nip,
			paid: participant?.paid,
		},
		participant
	);

	const handleDownloadPdf = async () => {
		const el = documentRef.current;
		if (!el || exporting) return;
		setPdfError(null);
		flushSync(() => {
			setExporting(true);
		});
		try {
			await downloadProformaPdf(el, invoice.number);
		} catch {
			setPdfError('Nie udało się wygenerować PDF. Spróbuj ponownie.');
		} finally {
			setExporting(false);
		}
	};

	return (
		<ContentSwap state='content'>
			<Stack spacing={2} sx={{ maxWidth: 800 }}>
				<Box
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 1.5,
						'@media print': { display: 'none' },
					}}
				>
					<Typography variant='h6' component='h1' sx={{ fontWeight: 800 }}>
						Proforma
					</Typography>
					<Button
						variant='contained'
						startIcon={exporting ? <CircularProgress size={18} color='inherit' /> : <Download />}
						disabled={exporting}
						onClick={() => void handleDownloadPdf()}
					>
						{exporting ? 'Generowanie…' : 'Pobierz PDF'}
					</Button>
				</Box>
				{pdfError ? (
					<Typography color='error' variant='body2'>
						{pdfError}
					</Typography>
				) : null}
				<ProformaDocument invoice={invoice} exporting={exporting} documentRef={documentRef} />
			</Stack>
		</ContentSwap>
	);
};
