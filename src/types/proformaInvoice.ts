export type PaymentStatus = 'unpaid' | 'paid' | 'overdue';

/** Buyer (nabywca) shown on the proforma. */
export type ProformaBuyer = {
	name: string;
	email?: string;
	phone?: string;
	nip?: string;
};

/** Proforma invoice — generated on-the-fly from billing data + course info */
export interface ProformaInvoice {
	/** Proforma invoice number e.g. PF/SZK-MF-PK/10/2026 */
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
	/** Service/item name (e.g. „Szkolenie strzeleckie: Movement Fundamentals”) */
	serviceName: string;
	/** Suggested bank-transfer title */
	paymentTitle: string;
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
	/** Buyer (nabywca) — omitted when unknown */
	buyer?: ProformaBuyer;
}
