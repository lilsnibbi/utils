/**
 * Checks if a string is a valid URL.
 * @param str - The string to check.
 * @returns True if the string is a valid URL.
 */
export interface IsLinkOptions {
	/** Allowed protocols. Defaults to allowing any valid protocol (e.g. ftp, mailto, file, etc.). */
	protocols?: string[];
}

export function isLink(str: string, options?: IsLinkOptions): boolean {
	try {
		const url = new URL(str);
		if (options?.protocols) {
			const protocol = url.protocol.replace(/:$/, "");
			return options.protocols.includes(protocol);
		}
		return true;
	} catch {
		return false;
	}
}
