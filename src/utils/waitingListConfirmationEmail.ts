import { CONTACT_EMAIL } from '@constants/contact';
import { Paths } from '@constants/paths';
import { SITE_NAME, SITE_ORIGIN } from '@constants/seo';
import { absoluteUrl } from '@/seo/meta';
import { escapeHtml } from '@/utils/escapeHtml';
import { fillPath } from '@/utils/paths';

/** Stayfrosty / Glocksklep brand tokens for transactional HTML email. */
const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

export type WaitingListConfirmationEmailInput = {
	courseName: string;
	courseSlug: string;
	recipientEmail: string;
};

export const buildWaitingListConfirmationSubject = (courseName: string): string =>
	`Lista oczekujących — ${courseName}`;

export const buildWaitingListConfirmationHtml = (
	input: WaitingListConfirmationEmailInput
): string => {
	const courseUrl = absoluteUrl(fillPath(Paths.coursePage, { slug: input.courseSlug }));
	const name = escapeHtml(input.courseName);
	const url = escapeHtml(courseUrl);
	const site = escapeHtml(SITE_NAME);
	const contact = escapeHtml(CONTACT_EMAIL);

	return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lista oczekujących — ${name}</title>
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
                Zapis na listę oczekujących
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                Dziękujemy za zapis na listę oczekujących na szkolenie
                <strong>${name}</strong>.
              </p>
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${ink};">
                Skontaktujemy się, gdy pojawi się wolne miejsce lub nowy termin tego szkolenia.
              </p>
              <p style="margin:0 0 16px;padding:12px 14px;border:2px solid ${accent};background:#fff5f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${ink};">
                To potwierdzenie dotyczy <strong>wyłącznie tego szkolenia</strong>.
                Nie zapisujesz się na newsletter glocksklep.pl.
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">
                <a href="${url}" style="color:${accent};font-weight:700;text-decoration:none;">Zobacz szkolenie →</a>
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
                · <a href="${escapeHtml(SITE_ORIGIN)}" style="color:${accent};text-decoration:none;">${escapeHtml(SITE_ORIGIN.replace(/^https?:\/\//, ''))}</a>
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

export const buildWaitingListConfirmationText = (
	input: WaitingListConfirmationEmailInput
): string => {
	const courseUrl = absoluteUrl(fillPath(Paths.coursePage, { slug: input.courseSlug }));
	return [
		SITE_NAME.toUpperCase(),
		`Zapis na listę oczekujących — ${input.courseName}`,
		'',
		`Dziękujemy za zapis na listę oczekujących na szkolenie „${input.courseName}”.`,
		'Skontaktujemy się, gdy pojawi się wolne miejsce lub nowy termin tego szkolenia.',
		'',
		'To potwierdzenie dotyczy wyłącznie tego szkolenia. Nie zapisujesz się na newsletter glocksklep.pl.',
		'',
		`Szkolenie: ${courseUrl}`,
		'',
		`Kontakt: ${CONTACT_EMAIL}`,
	].join('\n');
};
