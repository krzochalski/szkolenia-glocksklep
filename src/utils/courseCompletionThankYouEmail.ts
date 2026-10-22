import { CONTACT_EMAIL } from '@constants/contact';
import { SITE_NAME, SITE_ORIGIN } from '@constants/seo';
import type { CourseCompletionEmailVars, EmailTemplateWritable } from '@/types/emailTemplate';
import { escapeHtml } from '@/utils/escapeHtml';

const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

export const applyCourseCompletionPlaceholders = (
	template: string,
	vars: CourseCompletionEmailVars
): string =>
	template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
		key in vars ? vars[key as keyof CourseCompletionEmailVars] : `{{${key}}}`
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

export const buildCourseCompletionThankYouSubject = (
	template: EmailTemplateWritable,
	vars: CourseCompletionEmailVars
): string => applyCourseCompletionPlaceholders(template.subject, vars);

export const buildCourseCompletionThankYouHtml = (
	template: EmailTemplateWritable,
	vars: CourseCompletionEmailVars
): string => {
	const headline = escapeHtml(applyCourseCompletionPlaceholders(template.headline, vars));
	const bodyHtml = bodyToHtmlParagraphs(applyCourseCompletionPlaceholders(template.body, vars));
	const site = escapeHtml(SITE_NAME);
	const contact = escapeHtml(CONTACT_EMAIL);
	const materialsUrl = escapeHtml(vars.materialsUrl);
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
                <a href="${materialsUrl}" style="color:${accent};font-weight:700;text-decoration:none;">Materiały do nauki →</a>
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

export const buildCourseCompletionThankYouText = (
	template: EmailTemplateWritable,
	vars: CourseCompletionEmailVars
): string => {
	const headline = applyCourseCompletionPlaceholders(template.headline, vars);
	const body = applyCourseCompletionPlaceholders(template.body, vars);
	return [
		SITE_NAME.toUpperCase(),
		headline,
		'',
		body,
		'',
		`Materiały: ${vars.materialsUrl}`,
		`Ścieżka: ${vars.pathUrl}`,
		`Terminy: ${vars.trainingsUrl}`,
		'',
		`Kontakt: ${CONTACT_EMAIL}`,
	].join('\n');
};
