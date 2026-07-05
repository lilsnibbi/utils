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

	const iterator = segmenter.segment(str)[Symbol.iterator]();
	let count = 0;
	let truncatedStr = "";
	const limit = maxLength <= 3 ? maxLength : maxLength - 3;

	while (true) {
		const next = iterator.next();
		if (next.done) return str;

		count++;
		if (count <= limit) {
			truncatedStr += next.value.segment;
		}

		if (count > maxLength) break;
	}

	if (maxLength <= 3) return truncatedStr;
	return `${truncatedStr}...`;
}
