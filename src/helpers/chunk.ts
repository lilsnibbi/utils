/**
 * Splits any iterable into arrays of a fixed maximum size.
 *
 * Fractional sizes are rounded down to the nearest integer.
 *
 * @typeParam T - The type of each array item.
 * @param iterable - The values to split.
 * @param size - The maximum number of items in each chunk.
 * @returns A new array containing shallow copies of each chunk.
 * @throws {RangeError} If `size` is not finite or rounds down below `1`.
 */
export function chunk<T>(iterable: Iterable<T>, size: number): T[][] {
	if (!Number.isFinite(size)) {
		throw new RangeError("size must be a finite number");
	}

	const chunkSize = Math.floor(size);
	if (chunkSize < 1) {
		throw new RangeError("size must be greater than 0");
	}

	const chunks: T[][] = [];
	let current: T[] = [];
	for (const value of iterable) {
		current.push(value);
		if (current.length === chunkSize) {
			chunks.push(current);
			current = [];
		}
	}
	if (current.length) chunks.push(current);
	return chunks;
}
