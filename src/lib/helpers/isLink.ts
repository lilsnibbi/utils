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
	try {
		const url = new URL(str);
		const protocols = options?.protocols ?? DEFAULT_PROTOCOLS;
		const protocol = url.protocol.replace(/:$/, "");
		return protocols.includes(protocol);
	} catch {
		return false;
	}
}
