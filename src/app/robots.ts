import { SITE_ORIGIN } from '@constants/seo';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: [
				'/admin',
				'/admin/',
				'/profil',
				'/profil/',
				'/login',
				'/register',
				'/przypomnij-haslo',
				'/reset-hasla',
				'/auth/',
				'/konto-utworzone',
			],
		},
		sitemap: `${SITE_ORIGIN}/sitemap.xml`,
	};
}
