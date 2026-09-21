export type PaymentStatus = 'unpaid' | 'paid' | 'overdue';

/** Proforma invoice — generated on-the-fly from billing data + course info */
export interface ProformaInvoice {
	/** Proforma invoice number e.g. P2/06/2026 */
	number: string;
	/** Issue date in YYYY-MM-DD format */
	issueDate: string;
	/** Payment due date in YYYY-MM-DD format */
	dueDate: string;
	/** Payment method */
	paymentMethod: string;
	/** Place of issue */
	issuePlace: string;
	/** Net amount in PLN */
	amountNet: number;
	/** VAT amount in PLN */
	amountVat: number;
	/** Gross amount in PLN */
	amountGross: number;
	/** VAT rate percentage */
	vatRate: number;
	/** Service/item name */
	serviceName: string;
	/** Payment status */
	status: PaymentStatus;
	/** Download URL for the proforma PDF */
	downloadUrl?: string;
	/** Seller info */
	seller: {
		name: string;
		address: string;
		city: string;
		nip: string;
		website?: string;
		phone?: string;
		bankName: string;
		bankAccount: string;
	};
}
