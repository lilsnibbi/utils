/**
 * Generates a random integer between min and max (inclusive).
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A random integer.
 */
export function randomInt(min: number, max: number): number {
	const minInt = Math.ceil(min);
	const maxInt = Math.floor(max);
	if (minInt > maxInt) throw new Error("min cannot be greater than max");
	return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}
