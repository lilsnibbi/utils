/**
 * Truncates text to a maximum number of visible grapheme clusters.
 *
 * For limits above three, the returned value reserves three graphemes for
 * `"..."`. Limits from zero through three return the available text without an
 * ellipsis. Fractional limits are rounded down.
 *
 * @param value - The text to truncate.
 * @param maxLength - The maximum number of graphemes in the result.
 * @returns The original text or a grapheme-safe truncated version.
 * @throws {RangeError} If `maxLength` is negative or `NaN`.
 */
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function truncate(value: string, maxLength: number): string {
	if (maxLength === Number.POSITIVE_INFINITY) return value;
	if (!Number.isFinite(maxLength) || maxLength < 0) {
		throw new RangeError("maxLength must be a non-negative finite number");
	}

	const normalizedLength = Math.floor(maxLength);
	if (value.length <= normalizedLength) return value;

	const iterator = segmenter.segment(value)[Symbol.iterator]();
	let count = 0;
	let truncatedValue = "";
	const contentLimit =
		normalizedLength <= 3 ? normalizedLength : normalizedLength - 3;

	while (true) {
		const next = iterator.next();
		if (next.done) return value;

		count++;
		if (count <= contentLimit) {
			truncatedValue += next.value.segment;
		}

		if (count > normalizedLength) break;
	}

	if (normalizedLength <= 3) return truncatedValue;
	return `${truncatedValue}...`;
}
