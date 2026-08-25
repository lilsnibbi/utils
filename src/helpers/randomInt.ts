/**
 * Generates a random integer between min and max (inclusive).
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A random integer.
 */
export function randomInt(min: number, max: number): number {
	if (min > max) throw new Error("min cannot be greater than max");
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
