/** Extracts a YouTube video id from common watch / short / embed URLs. */
export const extractYoutubeId = (value: string | null | undefined): string | null => {
	if (!value?.trim()) return null;
	const raw = value.trim();
	try {
		const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
		const host = url.hostname.replace(/^www\./, '');
		if (host === 'youtu.be') {
			const id = url.pathname.split('/').filter(Boolean)[0];
			return id && /^[\w-]{11}$/.test(id) ? id : null;
		}
		if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
			if (url.pathname === '/watch') {
				const id = url.searchParams.get('v');
				return id && /^[\w-]{11}$/.test(id) ? id : null;
			}
			const embed = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
			return embed?.[1] ?? null;
		}
	} catch {
		return null;
	}
	return null;
};

export const youtubeEmbedUrl = (videoId: string): string =>
	`https://www.youtube-nocookie.com/embed/${videoId}`;
