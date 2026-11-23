import {
	CONTACT_EMAIL,
	coursePageUrl,
	escapeHtml,
	sendMail,
	SITE_NAME,
	SITE_ORIGIN,
} from './mail';
import {
	buildWaitlistUnsubscribeToken,
	waitlistUnsubscribeUrl,
} from './waitlistUnsubscribe';

const ink = '#191c1d';
const paper = '#ffffff';
const muted = '#f3f4f5';
const border = '#191c1d';
const accent = '#FF4F00';
const secondary = '#494847';

export type WaitingListMailInput = {
	courseName: string;
	courseSlug: string;
	recipientEmail: string;
	entryId: string;
	courseId: string;
};

const buildSubject = (courseName: string): string => `Lista oczekujących — ${courseName}`;

const buildHtml = (input: WaitingListMailInput & { unsubscribeUrl: string }): string => {
	const courseUrl = coursePageUrl(input.courseSlug);
	const name = escapeHtml(input.courseName);
	const url = escapeHtml(courseUrl);
	const site = escapeHtml(SITE_NAME);
	const contact = escapeHtml(CONTACT_EMAIL);
	const unsub = escapeHtml(input.unsubscribeUrl);

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
                Powiadomimy Cię e-mailem, gdy pojawi się nowy termin tego szkolenia.
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
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${secondary};">
                <a href="${unsub}" style="color:${accent};text-decoration:none;">Wypisz się z listy oczekujących</a>
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

const buildText = (input: WaitingListMailInput & { unsubscribeUrl: string }): string => {
	const courseUrl = coursePageUrl(input.courseSlug);
	return [
		SITE_NAME.toUpperCase(),
		`Zapis na listę oczekujących — ${input.courseName}`,
		'',
		`Dziękujemy za zapis na listę oczekujących na szkolenie „${input.courseName}”.`,
		'Powiadomimy Cię e-mailem, gdy pojawi się nowy termin tego szkolenia.',
		'',
		'To potwierdzenie dotyczy wyłącznie tego szkolenia. Nie zapisujesz się na newsletter glocksklep.pl.',
		'',
		`Szkolenie: ${courseUrl}`,
		`Wypisz się: ${input.unsubscribeUrl}`,
		'',
		`Kontakt: ${CONTACT_EMAIL}`,
	].join('\n');
};

/** Best-effort waiting-list confirmation (SMTP). Never throws. */
export const sendWaitingListConfirmation = async (
	input: WaitingListMailInput
): Promise<void> => {
	const email = input.recipientEmail.trim().toLowerCase();
	if (!email) return;
	const unsubscribeUrl = waitlistUnsubscribeUrl(
		buildWaitlistUnsubscribeToken({
			entryId: input.entryId,
			email,
			courseId: input.courseId,
		})
	);
	const mailInput = { ...input, recipientEmail: email, unsubscribeUrl };
	try {
		await sendMail({
			to: email,
			subject: buildSubject(input.courseName),
			html: buildHtml(mailInput),
			text: buildText(mailInput),
		});
	} catch (err) {
		console.error('Waiting-list confirmation email failed', err);
	}
};
