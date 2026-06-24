/**
 * Chunks an array into smaller arrays of a specified size.
 * @param array - The array to chunk.
 * @param size - The size of each chunk.
 * @returns An array of chunks.
 */
export function chunk<T = unknown>(array: T[], size: number): T[][] {
	const chunkSize = Math.floor(size);
	if (chunkSize <= 0) throw new Error("Size must be greater than 0");
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}
