/** Replaces `$param` segments in Paths templates with concrete values. */
export const fillPath = (template: string, params: Record<string, string>): string =>
	Object.entries(params).reduce((acc, [key, value]) => acc.replace(`$${key}`, value), template);
