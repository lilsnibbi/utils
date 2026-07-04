/**
 * Checks if a string is a valid URL.
 * @param str - The string to check.
 * @returns True if the string is a valid URL.
 */
export interface IsLinkOptions {
	/** Allowed protocols. Defaults to `['http', 'https']`. */
	protocols?: string[];
}

const DEFAULT_PROTOCOLS = ["http", "https"];

export function isLink(str: string, options?: IsLinkOptions): boolean {
	if (!URL.canParse(str)) {
		return false;
	}

	const protocols = options?.protocols ?? DEFAULT_PROTOCOLS;
	str = str.trimStart();
	const colonIdx = str.indexOf(":");
	if (colonIdx === -1) return false;

	const protocol = str.slice(0, colonIdx).toLowerCase();
	return protocols.includes(protocol);
}
