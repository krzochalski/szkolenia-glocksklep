import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

import {
	CONTACT_EMAIL,
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

type CompletionTemplate = {
	subject: string;
	headline: string;
	body: string;
};

type CompletionVars = {
	participantName: string;
	courseName: string;
	materialsUrl: string;
	nextPathSteps: string;
	pathUrl: string;
	trainingsUrl: string;
};

const DEFAULT_TEMPLATE: CompletionTemplate = {
	subject: 'Dziękujemy — {{courseName}} ukończone',
	headline: 'Dziękujemy za udział',
	body: [
		'Cześć {{participantName}},',
		'',
		'Dziękujemy za udział w szkoleniu {{courseName}}!',
		'',
		'Od teraz masz dostęp do materiałów do samodzielnej nauki (debriefing):',
		'{{materialsUrl}}',
		'',
		'Sugerowane kolejne kroki na ścieżce rozwoju:',
		'{{nextPathSteps}}',
		'',
		'Pełna ścieżka: {{pathUrl}}',
		'',
		'Sprawdź też najbliższe dostępne terminy szkoleń:',
		'{{trainingsUrl}}',
		'',
		'Do zobaczenia na kolejnym treningu!',
	].join('\n'),
};

const applyPlaceholders = (template: string, vars: CompletionVars): string =>
	template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
		key in vars ? vars[key as keyof CompletionVars] : `{{${key}}}`
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

const buildSubject = (template: CompletionTemplate, vars: CompletionVars): string =>
	applyPlaceholders(template.subject, vars);

const buildHtml = (template: CompletionTemplate, vars: CompletionVars): string => {
	const headline = escapeHtml(applyPlaceholders(template.headline, vars));
	const bodyHtml = bodyToHtmlParagraphs(applyPlaceholders(template.body, vars));
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

const buildText = (template: CompletionTemplate, vars: CompletionVars): string => {
	const headline = applyPlaceholders(template.headline, vars);
	const body = applyPlaceholders(template.body, vars);
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

const asString = (value: unknown, fallback: string): string =>
	typeof value === 'string' && value.trim() ? value.trim() : fallback;

const loadTemplate = async (db: Firestore): Promise<CompletionTemplate> => {
	const snap = await db.doc('emailTemplates/courseCompletionThankYou').get();
	if (!snap.exists) return { ...DEFAULT_TEMPLATE };
	const data = snap.data() ?? {};
	return {
		subject: asString(data.subject, DEFAULT_TEMPLATE.subject),
		headline: asString(data.headline, DEFAULT_TEMPLATE.headline),
		body: asString(data.body, DEFAULT_TEMPLATE.body),
	};
};

type PathStep = { courseSlug?: string; label?: string };
type PathLevel = { items?: PathStep[] };
type PathTrack = { title?: string; levels?: PathLevel[] };
type PathDoc = { paths?: PathTrack[] };

const formatNextPathSteps = (
	pathDoc: PathDoc | undefined,
	completedSlugs: ReadonlySet<string>,
	limit = 3
): string => {
	if (!pathDoc?.paths) return '';
	const lines: string[] = [];
	for (const track of pathDoc.paths) {
		for (const level of track.levels ?? []) {
			for (const item of level.items ?? []) {
				const slug = item.courseSlug?.trim();
				if (!slug || completedSlugs.has(slug)) continue;
				const label = item.label?.trim() || slug;
				const trackTitle = track.title?.trim();
				lines.push(trackTitle ? `• ${label} (${trackTitle})` : `• ${label}`);
				if (lines.length >= limit) return lines.join('\n');
			}
		}
	}
	return lines.join('\n');
};

/** Best-effort course-completion thank-you (SMTP). Never throws. */
export const sendCourseCompletionThankYou = async (params: {
	db: Firestore;
	auth: Auth;
	uid: string;
	courseId: string;
}): Promise<void> => {
	try {
		const [authUser, userSnap, courseSnap, pathSnap, completionsSnap] = await Promise.all([
			params.auth.getUser(params.uid),
			params.db.doc(`users/${params.uid}`).get(),
			params.db.collection('courses').doc(params.courseId).get(),
			params.db.doc('developmentPath/content').get(),
			params.db.collection(`users/${params.uid}/courseCompletions`).get(),
		]);

		const email = authUser.email?.trim();
		if (!email) return;
		if (!courseSnap.exists) return;

		const course = courseSnap.data() as { name?: string; slug?: string };
		const userData = userSnap.exists ? (userSnap.data() as { displayName?: string; fullName?: string }) : {};
		const participantName =
			userData.fullName?.trim() ||
			userData.displayName?.trim() ||
			authUser.displayName?.trim() ||
			email;

		const completedSlugs = new Set<string>();
		for (const doc of completionsSnap.docs) {
			const data = doc.data() as { courseSlug?: string };
			const slug = data.courseSlug?.trim() || doc.id;
			if (slug) completedSlugs.add(slug);
		}
		const courseSlug = course.slug?.trim() || params.courseId;
		completedSlugs.add(courseSlug);

		const pathDoc = pathSnap.exists ? (pathSnap.data() as PathDoc) : undefined;
		const nextPathSteps =
			formatNextPathSteps(pathDoc, completedSlugs) ||
			'Brak kolejnych kroków na ścieżce — sprawdź najbliższe terminy.';

		const vars: CompletionVars = {
			participantName,
			courseName: course.name?.trim() || 'Szkolenie',
			materialsUrl: `${SITE_ORIGIN}/profil/debriefing/${encodeURIComponent(params.courseId)}`,
			nextPathSteps,
			pathUrl: `${SITE_ORIGIN}/profil/sciezka-rozwoju`,
			trainingsUrl: `${SITE_ORIGIN}/najblizsze-szkolenia`,
		};

		const template = await loadTemplate(params.db);
		await sendMail({
			to: email,
			subject: buildSubject(template, vars),
			html: buildHtml(template, vars),
			text: buildText(template, vars),
		});
	} catch (err) {
		console.error('Course completion thank-you email failed', err);
	}
};
