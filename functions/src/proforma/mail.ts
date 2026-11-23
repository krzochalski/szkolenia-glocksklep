import {
	CONTACT_EMAIL,
	escapeHtml,
	sendMail,
	SITE_NAME,
	SITE_ORIGIN,
} from '../mail';
import type { BuiltProforma } from './build';
import { formatMoney, proformaPdfFileName } from './build';

const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

const money = (n: number): string => `${formatMoney(n)} PLN`;

const row = (label: string, value: string, last = false): string => `
  <tr>
    <td style="padding:6px 0 ${last ? '0' : '6px'};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${secondary};width:34%;vertical-align:top;">${label}</td>
    <td style="padding:6px 0 ${last ? '0' : '6px'};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${ink};vertical-align:top;">${value}</td>
  </tr>`;

const sectionLabel = (label: string): string =>
	`<p style="margin:0 0 10px;font-family:'Space Mono',Consolas,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${accent};">${escapeHtml(label)}</p>`;

export const buildProformaEmailHtml = (
	invoice: BuiltProforma,
	courseUrl: string
): string => {
	const originHost = escapeHtml(SITE_ORIGIN.replace(/^https?:\/\//, ''));
	return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Proforma ${escapeHtml(invoice.number)}</title>
</head>
<body style="margin:0;padding:0;background:${muted};color:${ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${muted};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${paper};border:3px solid ${border};">
          <tr>
            <td style="padding:20px 24px;border-bottom:3px solid ${border};background:${ink};">
              <p style="margin:0;font-family:'Space Mono',Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">${escapeHtml(SITE_NAME)}</p>
              <h1 style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.2;color:${paper};text-transform:uppercase;">
                Proforma ${escapeHtml(invoice.number)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                Cześć ${escapeHtml(invoice.buyer.name)},
              </p>
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                Potwierdzamy zapis. W załączniku znajdziesz proformę PDF. Poniżej dane do przelewu —
                możesz zapłacić od razu.
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${secondary};">
                ${escapeHtml(invoice.serviceLine)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              ${sectionLabel('Dane do przelewu')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${border};background:${muted};">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${row('Odbiorca', escapeHtml(invoice.seller.name))}
                      ${row('Bank', escapeHtml(invoice.seller.bankName))}
                      ${row('IBAN', `<span style="font-family:'Space Mono',Consolas,monospace;">${escapeHtml(invoice.seller.bankAccount)}</span>`)}
                      ${row('Tytuł', escapeHtml(invoice.paymentTitle))}
                      ${row('Termin płatności', escapeHtml(invoice.dueDate))}
                      ${row('Kwota brutto', escapeHtml(money(invoice.amountGross)), true)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              ${sectionLabel('Podsumowanie')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:${secondary};">Netto</td>
                  <td style="padding:4px 0;text-align:right;font-family:'Space Mono',Consolas,monospace;font-size:14px;">${escapeHtml(money(invoice.amountNet))}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:${secondary};">VAT ${invoice.vatRate}%</td>
                  <td style="padding:4px 0;text-align:right;font-family:'Space Mono',Consolas,monospace;font-size:14px;">${escapeHtml(money(invoice.amountVat))}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:${ink};">Brutto</td>
                  <td style="padding:10px 0 0;text-align:right;font-family:'Space Mono',Consolas,monospace;font-size:18px;font-weight:700;color:${accent};">${escapeHtml(money(invoice.amountGross))}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;border-top:3px solid ${border};background:${muted};">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${ink};">
                Szczegóły szkolenia:
                <a href="${escapeHtml(courseUrl)}" style="color:${accent};text-decoration:none;">${escapeHtml(courseUrl)}</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${secondary};">
                ${escapeHtml(SITE_NAME)} ·
                <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color:${accent};text-decoration:none;">${escapeHtml(CONTACT_EMAIL)}</a>
                · ${originHost}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const buildProformaEmailText = (
	invoice: BuiltProforma,
	courseUrl: string
): string =>
	[
		SITE_NAME,
		`Proforma ${invoice.number}`,
		'',
		`Cześć ${invoice.buyer.name},`,
		'Potwierdzamy zapis. W załączniku znajdziesz proformę PDF.',
		'',
		invoice.serviceLine,
		'',
		'— Dane do przelewu —',
		`Odbiorca: ${invoice.seller.name}`,
		`Bank: ${invoice.seller.bankName}`,
		`IBAN: ${invoice.seller.bankAccount}`,
		`Tytuł: ${invoice.paymentTitle}`,
		`Termin płatności: ${invoice.dueDate}`,
		`Kwota brutto: ${money(invoice.amountGross)}`,
		'',
		`Netto: ${money(invoice.amountNet)}`,
		`VAT ${invoice.vatRate}%: ${money(invoice.amountVat)}`,
		`Brutto: ${money(invoice.amountGross)}`,
		'',
		`Szczegóły: ${courseUrl}`,
		`${CONTACT_EMAIL}`,
	].join('\n');

export const sendProformaMail = async (params: {
	to: string;
	invoice: BuiltProforma;
	pdf: Buffer;
	courseUrl: string;
}): Promise<{ sent: boolean; reason?: string }> => {
	const subject = `Proforma ${params.invoice.number} — ${params.invoice.serviceName}`;
	return sendMail({
		to: params.to,
		subject,
		html: buildProformaEmailHtml(params.invoice, params.courseUrl),
		text: buildProformaEmailText(params.invoice, params.courseUrl),
		attachments: [
			{
				filename: proformaPdfFileName(params.invoice.number),
				content: params.pdf,
				contentType: 'application/pdf',
			},
		],
	});
};

export type UpdatedProformaMailParams = {
	to: string;
	invoice: BuiltProforma;
	pdf: Buffer;
	courseUrl: string;
	courseName: string;
	classDateYmd: string;
	oldAmountNet: number;
	newAmountNet: number;
	/** Customer-facing discount reason. */
	reason: string;
	/** When true: participant already paid more than new amount — no payment demand. */
	alreadyPaidOverNew: boolean;
	previousProformaNumber?: string;
};

export const buildUpdatedProformaSubject = (params: {
	courseName: string;
	classDateYmd: string;
}): string =>
	`Zaktualizowana proforma – ${params.courseName}, ${params.classDateYmd}`;

export const buildUpdatedProformaEmailHtml = (
	params: Omit<UpdatedProformaMailParams, 'to' | 'pdf'>
): string => {
	const { invoice, courseUrl } = params;
	const originHost = escapeHtml(SITE_ORIGIN.replace(/^https?:\/\//, ''));
	const diffNet = roundDiff(params.newAmountNet - params.oldAmountNet);
	const diffLabel =
		diffNet === 0
			? 'bez zmian'
			: diffNet < 0
				? `−${money(Math.abs(diffNet))} netto`
				: `+${money(diffNet)} netto`;

	const intro = params.alreadyPaidOverNew
		? `Zaktualizowaliśmy kwotę za udział w szkoleniu. Według naszych danych opłaciłeś/aś już ${escapeHtml(money(params.oldAmountNet))} netto — więcej niż nowa kwota ${escapeHtml(money(params.newAmountNet))} netto. Nie wymagamy dopłaty. Administrator skontaktuje się w sprawie nadpłaty / rozliczenia. Poniżej zaktualizowana proforma (informacyjnie).`
		: `Zaktualizowaliśmy kwotę za udział w szkoleniu. W załączniku znajdziesz nową proformę PDF. Poprzednia proforma${params.previousProformaNumber ? ` (${escapeHtml(params.previousProformaNumber)})` : ''} nie jest już ważna.`;

	const discountBlock =
		invoice.discountDescription != null
			? `<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${ink};">${escapeHtml(invoice.discountDescription)}</p>`
			: '';

	const paymentBlock = params.alreadyPaidOverNew
		? `
          <tr>
            <td style="padding:0 24px 24px;">
              ${sectionLabel('Rozliczenie')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${border};background:${muted};">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${row('Kwota już opłacona (netto)', escapeHtml(money(params.oldAmountNet)))}
                      ${row('Nowa kwota (netto)', escapeHtml(money(params.newAmountNet)))}
                      ${row('Różnica', escapeHtml(diffLabel), true)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
		: `
          <tr>
            <td style="padding:0 24px 24px;">
              ${sectionLabel('Dane do przelewu')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${border};background:${muted};">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${row('Odbiorca', escapeHtml(invoice.seller.name))}
                      ${row('Bank', escapeHtml(invoice.seller.bankName))}
                      ${row('IBAN', `<span style="font-family:'Space Mono',Consolas,monospace;">${escapeHtml(invoice.seller.bankAccount)}</span>`)}
                      ${row('Tytuł', escapeHtml(invoice.paymentTitle))}
                      ${row('Termin płatności', escapeHtml(invoice.dueDate))}
                      ${row('Kwota brutto', escapeHtml(money(invoice.amountGross)), true)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

	return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(buildUpdatedProformaSubject({ courseName: params.courseName, classDateYmd: params.classDateYmd }))}</title>
</head>
<body style="margin:0;padding:0;background:${muted};color:${ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${muted};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${paper};border:3px solid ${border};">
          <tr>
            <td style="padding:20px 24px;border-bottom:3px solid ${border};background:${ink};">
              <p style="margin:0;font-family:'Space Mono',Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">${escapeHtml(SITE_NAME)}</p>
              <h1 style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.25;color:${paper};text-transform:uppercase;">
                Zaktualizowana proforma
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                Cześć ${escapeHtml(invoice.buyer.name)},
              </p>
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                ${intro}
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${secondary};">
                ${escapeHtml(invoice.serviceLine)}
              </p>
              ${discountBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              ${sectionLabel('Zmiana ceny (netto)')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:${secondary};">Poprzednia kwota</td>
                  <td style="padding:4px 0;text-align:right;font-family:'Space Mono',Consolas,monospace;font-size:14px;">${escapeHtml(money(params.oldAmountNet))}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:${secondary};">Nowa kwota</td>
                  <td style="padding:4px 0;text-align:right;font-family:'Space Mono',Consolas,monospace;font-size:14px;">${escapeHtml(money(params.newAmountNet))}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:${secondary};">Różnica</td>
                  <td style="padding:4px 0;text-align:right;font-family:'Space Mono',Consolas,monospace;font-size:14px;">${escapeHtml(diffLabel)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:${secondary};">Powód</td>
                  <td style="padding:4px 0;text-align:right;font-size:14px;color:${ink};">${escapeHtml(params.reason)}</td>
                </tr>
              </table>
            </td>
          </tr>
          ${paymentBlock}
          <tr>
            <td style="padding:18px 24px;border-top:3px solid ${border};background:${muted};">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${ink};">
                Numer proformy: <strong>${escapeHtml(invoice.number)}</strong>
              </p>
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${ink};">
                Szczegóły:
                <a href="${escapeHtml(courseUrl)}" style="color:${accent};text-decoration:none;">${escapeHtml(courseUrl)}</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${secondary};">
                ${escapeHtml(SITE_NAME)} ·
                <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color:${accent};text-decoration:none;">${escapeHtml(CONTACT_EMAIL)}</a>
                · ${originHost}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const roundDiff = (n: number): number => Math.round(n * 100) / 100;

export const buildUpdatedProformaEmailText = (
	params: Omit<UpdatedProformaMailParams, 'to' | 'pdf'>
): string => {
	const diffNet = roundDiff(params.newAmountNet - params.oldAmountNet);
	const lines = [
		SITE_NAME,
		buildUpdatedProformaSubject({
			courseName: params.courseName,
			classDateYmd: params.classDateYmd,
		}),
		'',
		`Cześć ${params.invoice.buyer.name},`,
		params.alreadyPaidOverNew
			? `Zaktualizowaliśmy kwotę. Opłacono już ${money(params.oldAmountNet)} netto (więcej niż nowa kwota ${money(params.newAmountNet)} netto). Nie wymagamy dopłaty — administrator skontaktuje się w sprawie nadpłaty.`
			: `Zaktualizowaliśmy kwotę. W załączniku nowa proforma PDF. Poprzednia proforma${params.previousProformaNumber ? ` (${params.previousProformaNumber})` : ''} nie jest już ważna.`,
		'',
		params.invoice.serviceLine,
		params.invoice.discountDescription ?? '',
		'',
		`Poprzednia kwota netto: ${money(params.oldAmountNet)}`,
		`Nowa kwota netto: ${money(params.newAmountNet)}`,
		`Różnica netto: ${diffNet >= 0 ? '+' : ''}${money(diffNet)}`,
		`Powód: ${params.reason}`,
		'',
	];
	if (!params.alreadyPaidOverNew) {
		lines.push(
			'— Dane do przelewu —',
			`Odbiorca: ${params.invoice.seller.name}`,
			`Bank: ${params.invoice.seller.bankName}`,
			`IBAN: ${params.invoice.seller.bankAccount}`,
			`Tytuł: ${params.invoice.paymentTitle}`,
			`Termin płatności: ${params.invoice.dueDate}`,
			`Kwota brutto: ${money(params.invoice.amountGross)}`,
			''
		);
	}
	lines.push(`Proforma: ${params.invoice.number}`, `Szczegóły: ${params.courseUrl}`, CONTACT_EMAIL);
	return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');
};

export const sendUpdatedProformaMail = async (
	params: UpdatedProformaMailParams
): Promise<{ sent: boolean; reason?: string }> => {
	const mailParams = {
		invoice: params.invoice,
		courseUrl: params.courseUrl,
		courseName: params.courseName,
		classDateYmd: params.classDateYmd,
		oldAmountNet: params.oldAmountNet,
		newAmountNet: params.newAmountNet,
		reason: params.reason,
		alreadyPaidOverNew: params.alreadyPaidOverNew,
		previousProformaNumber: params.previousProformaNumber,
	};
	return sendMail({
		to: params.to,
		subject: buildUpdatedProformaSubject({
			courseName: params.courseName,
			classDateYmd: params.classDateYmd,
		}),
		html: buildUpdatedProformaEmailHtml(mailParams),
		text: buildUpdatedProformaEmailText(mailParams),
		attachments: [
			{
				filename: proformaPdfFileName(params.invoice.number),
				content: params.pdf,
				contentType: 'application/pdf',
			},
		],
	});
};
