/**
 * Splits an array into shallow chunks without modifying the input.
 *
 * Fractional sizes are rounded down to the nearest integer.
 *
 * @typeParam T - The type of each array item.
 * @param array - The array to split.
 * @param size - The maximum number of items in each chunk.
 * @returns A new array containing shallow copies of each chunk.
 * @throws {RangeError} If `size` is not finite or rounds down below `1`.
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
	if (!Number.isFinite(size)) {
		throw new RangeError("size must be a finite number");
	}

	const chunkSize = Math.floor(size);
	if (chunkSize < 1) {
		throw new RangeError("size must be greater than 0");
	}

	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}
