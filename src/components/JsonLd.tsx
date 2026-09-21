export const safeJsonLd = (value: unknown): string =>
	JSON.stringify(value).replace(/</g, '\\u003c');

type JsonLdProps = {
	readonly data: unknown;
};

export const JsonLd = ({ data }: JsonLdProps) => {
	if (data == null) return null;
	const items = Array.isArray(data) ? data : [data];
	return (
		<>
			{items.map((item, index) => (
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON.stringify with < escaped
					dangerouslySetInnerHTML={{ __html: safeJsonLd(item) }}
					key={JSON.stringify(item) + String(index)}
					type='application/ld+json'
				/>
			))}
		</>
	);
};
