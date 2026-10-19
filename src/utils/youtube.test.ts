import { describe, expect, it } from 'vitest';
import { extractYoutubeId, youtubeEmbedUrl } from './youtube';

describe('extractYoutubeId', () => {
	it('parses watch, short, and embed URLs', () => {
		expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
			'dQw4w9WgXcQ'
		);
		expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
			'dQw4w9WgXcQ'
		);
		expect(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
			'dQw4w9WgXcQ'
		);
	});

	it('rejects non-youtube or invalid ids', () => {
		expect(extractYoutubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
		expect(extractYoutubeId('not-a-url')).toBeNull();
		expect(extractYoutubeId('')).toBeNull();
	});
});

describe('youtubeEmbedUrl', () => {
	it('uses nocookie host', () => {
		expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe(
			'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
		);
	});
});
