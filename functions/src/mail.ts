import nodemailer, { type Transporter } from 'nodemailer';

export const CONTACT_EMAIL = 'zamowienia@glocksklep.pl';
export const SITE_NAME = 'GLOCKSKLEP Szkolenia';
export const SITE_ORIGIN = 'https://szkolenia.glocksklep.pl';

export type OutboundMail = {
	to: string;
	subject: string;
	html: string;
	text: string;
	replyTo?: string;
};

type MailTransport = {
	transporter: Transporter;
	from: string;
};

export const createMailTransport = ():
	| { ok: true; mail: MailTransport }
	| { ok: false; reason: string } => {
	const host = process.env.SMTP_HOST?.trim();
	const user = process.env.SMTP_USER?.trim();
	const pass = process.env.SMTP_PASS?.trim();
	const from = (process.env.MAIL_FROM?.trim() || user || CONTACT_EMAIL).trim();
	const port = Number(process.env.SMTP_PORT || '587');

	if (!host || !user || !pass) {
		console.warn('SMTP not configured (SMTP_HOST/USER/PASS) — skipping email');
		return { ok: false, reason: 'smtp_not_configured' };
	}

	return {
		ok: true,
		mail: {
			transporter: nodemailer.createTransport({
				host,
				port,
				secure: port === 465,
				auth: { user, pass },
			}),
			from: `"${SITE_NAME}" <${from}>`,
		},
	};
};

export const sendMail = async (
	message: OutboundMail
): Promise<{ sent: boolean; reason?: string }> => {
	const setup = createMailTransport();
	if (!setup.ok) {
		return { sent: false, reason: setup.reason };
	}
	const { transporter, from } = setup.mail;
	await transporter.sendMail({
		from,
		to: message.to,
		replyTo: message.replyTo ?? CONTACT_EMAIL,
		subject: message.subject,
		html: message.html,
		text: message.text,
	});
	return { sent: true };
};

export const escapeHtml = (value: string): string =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');

export const coursePageUrl = (slug: string): string =>
	`${SITE_ORIGIN}/szkolenia/${encodeURIComponent(slug)}`;
