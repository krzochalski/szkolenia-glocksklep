'use client';

import { PAYMENT_AND_DOCUMENT_INFO } from '@constants/paymentAndDocument';
import { Box, Typography } from '@ui';
import type { SalesDocumentType } from '@/types/course';
import { salesDocumentLabel } from '@/utils/salesDocument';

type Props = {
	readonly compact?: boolean;
	/** Highlight the document type for this enrollment (participant panel, proforma). */
	readonly documentType?: SalesDocumentType;
	readonly sx?: Record<string, unknown>;
};

export const PaymentDocumentInfo = ({ compact = false, documentType, sx }: Props) => {
	const docLine = documentType
		? `Po opłaceniu otrzymasz: ${salesDocumentLabel(documentType)}.`
		: PAYMENT_AND_DOCUMENT_INFO.document;

	return (
		<Box
			role='note'
			sx={{
				border: '2px solid',
				borderColor: 'ink.main',
				bgcolor: 'surface.muted',
				p: compact ? 1.5 : 2,
				...sx,
			}}
		>
			{!compact ? (
				<Typography
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.625rem',
						fontWeight: 700,
						letterSpacing: '0.14em',
						textTransform: 'uppercase',
						color: 'primary.main',
						mb: 1,
					}}
				>
					{PAYMENT_AND_DOCUMENT_INFO.title}
				</Typography>
			) : null}
			<Typography variant='body2' sx={{ mb: compact ? 0.5 : 1, lineHeight: 1.55 }}>
				{compact ? PAYMENT_AND_DOCUMENT_INFO.shortPayment : PAYMENT_AND_DOCUMENT_INFO.payment}
			</Typography>
			<Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.55 }}>
				{compact ? PAYMENT_AND_DOCUMENT_INFO.shortDocument : docLine}
			</Typography>
		</Box>
	);
};