import { getAuth } from 'firebase-admin/auth';

import { escapeHtml, sendMail, SITE_NAME, SITE_ORIGIN } from './mail';

/** Custom handler (Firebase Console action URL is locked to firebaseapp.com). */
export const AUTH_ACTION_URL = `${SITE_ORIGIN}/auth/action`;

const rewriteAuthActionLink = (firebaseLink: string): string => {
	const src = new URL(firebaseLink);
	const dest = new URL(AUTH_ACTION_URL);
	src.searchParams.forEach((value, key) => {
		dest.searchParams.set(key, value);
	});
	return dest.toString();
};

const passwordResetHtml = (link: string): string => {
	const safe = escapeHtml(link);
	return `<!DOCTYPE html>
<html lang="pl">
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;color:#191c1d;background:#f3f4f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid #191c1d;padding:24px;">
    <p style="margin:0 0 12px;font-weight:700;">${escapeHtml(SITE_NAME)}</p>
    <h1 style="margin:0 0 16px;font-size:22px;">Reset hasła</h1>
    <p style="margin:0 0 16px;line-height:1.5;">Kliknij poniższy link, aby ustawić nowe hasło do konta.</p>
    <p style="margin:0 0 24px;"><a href="${safe}" style="color:#FF4F00;">Ustaw nowe hasło</a></p>
    <p style="margin:0;font-size:13px;color:#494847;word-break:break-all;">${safe}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#494847;">Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
  </div>
</body>
</html>`;
};

const emailLinkHtml = (link: string): string => {
	const safe = escapeHtml(link);
	return `<!DOCTYPE html>
<html lang="pl">
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;color:#191c1d;background:#f3f4f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid #191c1d;padding:24px;">
    <p style="margin:0 0 12px;font-weight:700;">${escapeHtml(SITE_NAME)}</p>
    <h1 style="margin:0 0 16px;font-size:22px;">Link do logowania</h1>
    <p style="margin:0 0 16px;line-height:1.5;">Kliknij poniższy link, aby zalogować się bez hasła.</p>
    <p style="margin:0 0 24px;"><a href="${safe}" style="color:#FF4F00;">Zaloguj się</a></p>
    <p style="margin:0;font-size:13px;color:#494847;word-break:break-all;">${safe}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#494847;">Jeśli nie prosiłeś o ten link, zignoruj tę wiadomość.</p>
  </div>
</body>
</html>`;
};

/**
 * Generate Firebase oob link, rewrite host to SITE_ORIGIN/auth/action, send via SMTP.
 * Always resolves ok for unknown emails (no account enumeration).
 */
export const sendPasswordResetMail = async (
	email: string
): Promise<{ ok: true } | { ok: false; reason: string }> => {
	const normalized = email.trim().toLowerCase();
	try {
		const firebaseLink = await getAuth().generatePasswordResetLink(normalized, {
			url: `${SITE_ORIGIN}/login?reset=1`,
			handleCodeInApp: true,
		});
		const link = rewriteAuthActionLink(firebaseLink);
		const result = await sendMail({
			to: normalized,
			subject: `Reset hasła — ${SITE_NAME}`,
			html: passwordResetHtml(link),
			text: [
				`Reset hasła — ${SITE_NAME}`,
				'',
				'Otwórz ten link, aby ustawić nowe hasło:',
				link,
				'',
				'Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.',
			].join('\n'),
		});
		if (!result.sent) {
			return { ok: false, reason: result.reason ?? 'send_failed' };
		}
		return { ok: true };
	} catch (err) {
		const code =
			typeof err === 'object' && err !== null && 'code' in err
				? String((err as { code: string }).code)
				: '';
		// User not found / invalid email → still report success to the client
		if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
			return { ok: true };
		}
		console.error('sendPasswordResetMail', err);
		return { ok: false, reason: 'generate_or_send_failed' };
	}
};

export const sendEmailSignInMail = async (
	email: string
): Promise<{ ok: true } | { ok: false; reason: string }> => {
	const normalized = email.trim().toLowerCase();
	try {
		const firebaseLink = await getAuth().generateSignInWithEmailLink(normalized, {
			url: `${SITE_ORIGIN}/auth/email-link`,
			handleCodeInApp: true,
		});
		const link = rewriteAuthActionLink(firebaseLink);
		const result = await sendMail({
			to: normalized,
			subject: `Link do logowania — ${SITE_NAME}`,
			html: emailLinkHtml(link),
			text: [
				`Link do logowania — ${SITE_NAME}`,
				'',
				'Otwórz ten link, aby się zalogować:',
				link,
				'',
				'Jeśli nie prosiłeś o ten link, zignoruj tę wiadomość.',
			].join('\n'),
		});
		if (!result.sent) {
			return { ok: false, reason: result.reason ?? 'send_failed' };
		}
		return { ok: true };
	} catch (err) {
		console.error('sendEmailSignInMail', err);
		return { ok: false, reason: 'generate_or_send_failed' };
	}
};
