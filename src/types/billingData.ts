/** Billing data set linked to an instructor — used to generate proforma invoices */
export interface BillingData {
	id: string;
	/** Reference to the instructor this billing data belongs to */
	instructorId: string;
	/** Company / seller name */
	name: string;
	/** Street address */
	address: string;
	/** City with postal code */
	city: string;
	/** Tax identification number (NIP) */
	nip: string;
	/** Website URL (optional) */
	website?: string;
	/** Phone number (optional) */
	phone?: string;
	/** Bank name */
	bankName: string;
	/** Bank account number (IBAN) */
	bankAccount: string;
	/** Default payment method */
	paymentMethod: string;
	/** Default place of issue */
	issuePlace: string;
	/** Default VAT rate percentage */
	vatRate: number;
}
