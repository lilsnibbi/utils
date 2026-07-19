import { describe, expect, test } from "bun:test";
import { randomInt } from "../src";

describe("randomInt", () => {
	test("generates an integer within a positive range (inclusive)", () => {
		const min = 1;
		const max = 10;
		for (let i = 0; i < 200; i++) {
			const result = randomInt(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThanOrEqual(max);
			expect(Number.isInteger(result)).toBe(true);
		}
	});

	test("generates an integer within a negative range (inclusive)", () => {
		const min = -20;
		const max = -10;
		for (let i = 0; i < 50; i++) {
			const result = randomInt(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThanOrEqual(max);
			expect(Number.isInteger(result)).toBe(true);
		}
	});

	test("generates an integer within a range spanning zero", () => {
		const min = -5;
		const max = 5;
		for (let i = 0; i < 100; i++) {
			const result = randomInt(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThanOrEqual(max);
		}
	});

	test("returns exactly min when min and max are equal", () => {
		expect(randomInt(5, 5)).toBe(5);
		expect(randomInt(-10, -10)).toBe(-10);
		expect(randomInt(0, 0)).toBe(0);
	});

	test("throws when the normalized range is empty", () => {
		expect(() => randomInt(10, 5)).toThrow("min cannot be greater than max");
		expect(() => randomInt(0, -1)).toThrow("min cannot be greater than max");
		expect(() => randomInt(1.2, 1.8)).toThrow(
			"min cannot be greater than max after rounding",
		);
	});

	test("rejects non-finite and unsafe bounds", () => {
		expect(() => randomInt(Number.NaN, 1)).toThrow(
			"min and max must be finite numbers",
		);
		expect(() => randomInt(0, Number.POSITIVE_INFINITY)).toThrow(
			"min and max must be finite numbers",
		);
		expect(() =>
			randomInt(Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 2),
		).toThrow("min and max must be safe integers after rounding");
	});

	test("rejects ranges larger than node:crypto supports", () => {
		expect(() => randomInt(0, 2 ** 48)).toThrow(
			"the inclusive range must not exceed 2^48 values",
		);
	});

	test("handles large boundaries", () => {
		const min = 1000000;
		const max = 1000005;
		const result = randomInt(min, max);
		expect(result).toBeGreaterThanOrEqual(min);
		expect(result).toBeLessThanOrEqual(max);
	});

	test("handles float inputs correctly", () => {
		const result = randomInt(1.5, 4.5);
		expect(result).toBeGreaterThanOrEqual(2);
		expect(result).toBeLessThanOrEqual(4);
		expect(Number.isInteger(result)).toBe(true);
	});
});
