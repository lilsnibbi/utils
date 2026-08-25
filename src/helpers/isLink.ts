/**
 * Checks if a string is a valid URL.
 * @param str - The string to check.
 * @returns True if the string is a valid URL.
 */
export function isLink(str: string): boolean {
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
}
