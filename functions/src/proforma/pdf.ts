import PDFDocument from 'pdfkit';

import type { BuiltProforma } from './build';
import { formatMoney } from './build';

const ink = '#191c1d';
const muted = '#494847';
const accent = '#FF4F00';

const moneyPln = (n: number): string => `${formatMoney(n)} PLN`;

/** Render a simple A4 proforma PDF (server-side; visual sibling of client download). */
export const renderProformaPdf = (invoice: BuiltProforma): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		const doc = new PDFDocument({ size: 'A4', margin: 48 });
		const chunks: Buffer[] = [];
		doc.on('data', (c: Buffer) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		doc.fillColor(accent).fontSize(10).text('GLOCKSKLEP SZKOLENIA · PROFORMA', {
			characterSpacing: 1.2,
		});
		doc.moveDown(0.4);
		doc.fillColor(ink).fontSize(20).text('Proforma', { continued: false });
		doc.fontSize(12).fillColor(muted).text(invoice.number);
		doc.moveDown();

		doc.fillColor(ink).fontSize(11);
		doc.text(`Miejsce wystawienia: ${invoice.issuePlace}`);
		doc.text(`Data wystawienia: ${invoice.issueDate}`);
		doc.text(`Termin płatności: ${invoice.dueDate}`);
		doc.text(`Forma płatności: ${invoice.paymentMethod}`);
		doc.moveDown();

		doc.fontSize(12).fillColor(accent).text('Sprzedawca');
		doc.fontSize(11).fillColor(ink);
		doc.text(invoice.seller.name);
		doc.text(invoice.seller.address);
		doc.text(invoice.seller.city);
		doc.text(`NIP: ${invoice.seller.nip}`);
		if (invoice.seller.phone) doc.text(`Tel: ${invoice.seller.phone}`);
		doc.moveDown();

		doc.fontSize(12).fillColor(accent).text('Nabywca');
		doc.fontSize(11).fillColor(ink);
		doc.text(invoice.buyer.name);
		if (invoice.buyer.email) doc.text(invoice.buyer.email);
		if (invoice.buyer.phone) doc.text(invoice.buyer.phone);
		if (invoice.buyer.nip) doc.text(`NIP: ${invoice.buyer.nip}`);
		doc.moveDown();

		doc.fontSize(12).fillColor(accent).text('Pozycja');
		doc.fontSize(11).fillColor(ink);
		doc.text(invoice.serviceLine);
		doc.text(`Ilość: 1`);
		doc.moveDown(0.5);
		if (
			invoice.baseAmountNet != null &&
			invoice.discountTotal != null &&
			invoice.discountTotal > 0
		) {
			doc.text(`Cena regularna (netto): ${moneyPln(invoice.baseAmountNet)}`);
			doc.text(
				`Rabat (netto): −${moneyPln(invoice.discountTotal)}${
					invoice.discountReason ? ` — ${invoice.discountReason}` : ''
				}`
			);
			if (invoice.discountDescription) {
				doc.fillColor(muted).text(invoice.discountDescription, { width: 500 });
				doc.fillColor(ink);
			}
			doc.moveDown(0.3);
		}
		doc.text(`Netto: ${moneyPln(invoice.amountNet)}`);
		doc.text(`VAT ${invoice.vatRate}%: ${moneyPln(invoice.amountVat)}`);
		doc.fontSize(13).fillColor(ink).text(`Brutto: ${moneyPln(invoice.amountGross)}`);
		doc.moveDown();

		doc.fontSize(12).fillColor(accent).text('Dane do przelewu');
		doc.fontSize(11).fillColor(ink);
		doc.text(`Bank: ${invoice.seller.bankName}`);
		doc.text(`Numer konta: ${invoice.seller.bankAccount}`);
		doc.text(`Tytuł: ${invoice.paymentTitle}`);
		doc.text(`Kwota: ${moneyPln(invoice.amountGross)}`);
		doc.moveDown();

		doc.fontSize(9).fillColor(muted).text(
			'Dokument informacyjny do zapłaty za udział w szkoleniu. Nie jest fakturą VAT.',
			{ width: 500 }
		);

		doc.end();
	});
