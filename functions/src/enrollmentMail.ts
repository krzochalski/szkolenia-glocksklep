import type { Firestore } from 'firebase-admin/firestore';

import {
	CONTACT_EMAIL,
	coursePageUrl,
	escapeHtml,
	sendMail,
	SITE_NAME,
	SITE_ORIGIN,
} from './mail';

const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

type EnrollmentTemplate = {
	subject: string;
	headline: string;
	body: string;
};

type EnrollmentVars = {
	participantName: string;
	courseName: string;
	date: string;
	timeStart: string;
	place: string;
	courseUrl: string;
};

const DEFAULT_TEMPLATE: EnrollmentTemplate = {
	subject: 'Potwierdzenie zapisu — {{courseName}}',
	headline: 'Zapis potwierdzony',
	body: [
		'Cześć {{participantName}},',
		'',
		'Dziękujemy za zapis na szkolenie {{courseName}}.',
		'',
		'Termin: {{date}} · {{timeStart}}',
		'Miejsce: {{place}}',
		'',
		'Do zobaczenia na treningu!',
		'',
		'Szczegóły szkolenia: {{courseUrl}}',
	].join('\n'),
};

const applyPlaceholders = (template: string, vars: EnrollmentVars): string =>
	template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
		key in vars ? vars[key as keyof EnrollmentVars] : `{{${key}}}`
	);

const bodyToHtmlParagraphs = (body: string): string =>
	body
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean)
		.map((block) => {
			const lines = escapeHtml(block).replace(/\n/g, '<br/>');
			return `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">${lines}</p>`;
		})
		.join('');

const buildSubject = (template: EnrollmentTemplate, vars: EnrollmentVars): string =>
	applyPlaceholders(template.subject, vars);

const buildHtml = (template: EnrollmentTemplate, vars: EnrollmentVars): string => {
	const headline = escapeHtml(applyPlaceholders(template.headline, vars));
	const bodyHtml = bodyToHtmlParagraphs(applyPlaceholders(template.body, vars));
	const site = escapeHtml(SITE_NAME);
	const contact = escapeHtml(CONTACT_EMAIL);
	const courseUrl = escapeHtml(vars.courseUrl);
	const originHost = escapeHtml(SITE_ORIGIN.replace(/^https?:\/\//, ''));

	return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:${muted};color:${ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${muted};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${paper};border:3px solid ${border};">
          <tr>
            <td style="padding:20px 24px;border-bottom:3px solid ${border};background:${ink};">
              <p style="margin:0;font-family:'Space Mono',Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">${site}</p>
              <h1 style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;color:${paper};text-transform:uppercase;">
                ${headline}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${bodyHtml}
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">
                <a href="${courseUrl}" style="color:${accent};font-weight:700;text-decoration:none;">Zobacz szkolenie →</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;border-top:3px solid ${border};background:${muted};">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${ink};">
                Jeśli nie widzisz tej wiadomości w skrzynce — sprawdź folder <strong>spam / oferty</strong>.
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${secondary};">
                ${site} ·
                <a href="mailto:${contact}" style="color:${accent};text-decoration:none;">${contact}</a>
                · <a href="${escapeHtml(SITE_ORIGIN)}" style="color:${accent};text-decoration:none;">${originHost}</a>
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

const buildText = (template: EnrollmentTemplate, vars: EnrollmentVars): string => {
	const headline = applyPlaceholders(template.headline, vars);
	const body = applyPlaceholders(template.body, vars);
	return [
		SITE_NAME.toUpperCase(),
		headline,
		'',
		body,
		'',
		`Szkolenie: ${vars.courseUrl}`,
		'',
		`Kontakt: ${CONTACT_EMAIL}`,
	].join('\n');
};

const asString = (value: unknown, fallback: string): string =>
	typeof value === 'string' && value.trim() ? value.trim() : fallback;

const loadTemplate = async (db: Firestore): Promise<EnrollmentTemplate> => {
	const snap = await db.doc('emailTemplates/enrollmentConfirmation').get();
	if (!snap.exists) return { ...DEFAULT_TEMPLATE };
	const data = snap.data() ?? {};
	return {
		subject: asString(data.subject, DEFAULT_TEMPLATE.subject),
		headline: asString(data.headline, DEFAULT_TEMPLATE.headline),
		body: asString(data.body, DEFAULT_TEMPLATE.body),
	};
};

type CourseDate = {
	id?: string;
	date?: string;
	timeStart?: string;
	place?: { name?: string };
};

type CourseDoc = {
	name?: string;
	slug?: string;
	dates?: CourseDate[];
};

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

/** Best-effort enrollment confirmation (SMTP). Never throws. */
export const sendEnrollmentConfirmation = async (params: {
	db: Firestore;
	courseId: string;
	dateId: string;
	participant: { name: string; email: string };
}): Promise<void> => {
	const email = params.participant.email?.trim();
	if (!email) return;

	try {
		const courseSnap = await params.db.collection('courses').doc(params.courseId).get();
		if (!courseSnap.exists) return;
		const course = courseSnap.data() as CourseDoc;
		const date = (course.dates ?? []).find((d) => matchDate(d, params.dateId));
		if (!date) return;

		const slug = course.slug?.trim() || params.courseId;
		const vars: EnrollmentVars = {
			participantName: params.participant.name,
			courseName: course.name?.trim() || 'Szkolenie',
			date: date.date ?? params.dateId,
			timeStart: date.timeStart ?? '—',
			place: date.place?.name ?? '—',
			courseUrl: coursePageUrl(slug),
		};
		const template = await loadTemplate(params.db);
		await sendMail({
			to: email,
			subject: buildSubject(template, vars),
			html: buildHtml(template, vars),
			text: buildText(template, vars),
		});
	} catch (err) {
		console.error('Enrollment confirmation email failed', err);
	}
};
