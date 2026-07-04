/**
 * Truncates a string to a specified length and appends an ellipsis if it exceeds that length.
 * @param str - The string to truncate.
 * @param maxLength - The maximum length of the string.
 * @returns The truncated string.
 */
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

export function truncate(str: string, maxLength: number): string {
	if (maxLength < 0) throw new Error("maxLength cannot be negative");

	if (str.length <= maxLength) return str;

	const segments: string[] = [];
	for (const { segment } of segmenter.segment(str)) {
		segments.push(segment);
		if (segments.length > maxLength) break;
	}

	if (segments.length <= maxLength) return str;
	if (maxLength <= 3) return segments.slice(0, maxLength).join("");
	return `${segments.slice(0, maxLength - 3).join("")}...`;
}
