/**
 * Truncates a string to a specified length and appends an ellipsis if it exceeds that length.
 * @param str - The string to truncate.
 * @param maxLength - The maximum length of the string.
 * @returns The truncated string.
 */
export function truncate(str: string, maxLength: number): string {
	if (maxLength < 0) throw new Error("maxLength cannot be negative");
	if (str.length <= maxLength) return str;
	if (maxLength <= 3) return str.slice(0, maxLength);
	return `${str.slice(0, maxLength - 3)}...`;
}
