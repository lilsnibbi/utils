import { randomInt as cryptoRandomInt } from "node:crypto";

const MAX_RANDOM_RANGE = 2 ** 48;

/**
 * Generates a cryptographically secure random integer within an inclusive range.
 *
 * Fractional bounds are narrowed inward using `Math.ceil(min)` and
 * `Math.floor(max)`.
 *
 * @param min - The inclusive lower bound.
 * @param max - The inclusive upper bound.
 * @returns A random integer between the normalized bounds.
 * @throws {RangeError} If the bounds are non-finite, unsafe, empty, or span more
 * than the range supported by `node:crypto`.
 */
export function randomInt(min: number, max: number): number {
	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		throw new RangeError("min and max must be finite numbers");
	}

	const minInt = Math.ceil(min);
	const maxInt = Math.floor(max);
	if (!Number.isSafeInteger(minInt) || !Number.isSafeInteger(maxInt)) {
		throw new RangeError("min and max must be safe integers after rounding");
	}
	if (minInt > maxInt) {
		throw new RangeError("min cannot be greater than max after rounding");
	}
	if (minInt === maxInt) return minInt;

	const range = maxInt - minInt + 1;
	if (range > MAX_RANDOM_RANGE) {
		throw new RangeError("the inclusive range must not exceed 2^48 values");
	}

	return cryptoRandomInt(range) + minInt;
}
