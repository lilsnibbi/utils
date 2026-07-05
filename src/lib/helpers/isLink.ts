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
	const protocols = options?.protocols ?? DEFAULT_PROTOCOLS;

	// Fast path: avoid expensive URL parsing if the string lacks a valid protocol prefix.
	str = str.trimStart();
	const colonIdx = str.indexOf(":");
	if (colonIdx === -1) return false;

	const protocol = str.slice(0, colonIdx).toLowerCase();
	if (!protocols.includes(protocol)) return false;

	return URL.canParse(str);
}
