import { describe, expect, test } from "bun:test";
import { truncate } from "../src";

describe("truncate", () => {
	test("truncates a string and appends an ellipsis when it exceeds max length", () => {
		expect(truncate("Hello World", 8)).toBe("Hello...");
		expect(truncate("TypeScript is amazing", 13)).toBe("TypeScript...");
	});

	test("returns the original string if it is strictly less than max length", () => {
		expect(truncate("Hello", 10)).toBe("Hello");
		expect(truncate("", 5)).toBe("");
	});

	test("returns the original string if it is exactly max length", () => {
		expect(truncate("Hello", 5)).toBe("Hello");
		expect(truncate("Exact", 5)).toBe("Exact");
	});

	test("throws an error if maxLength is negative", () => {
		expect(() => truncate("Hello", -1)).toThrow(
			"maxLength must be a non-negative finite number",
		);
		expect(() => truncate("Hello", Number.NaN)).toThrow(
			"maxLength must be a non-negative finite number",
		);
	});

	test("floors fractional limits and permits an infinite limit", () => {
		expect(truncate("Hello", 2.9)).toBe("He");
		expect(truncate("Hello", Number.POSITIVE_INFINITY)).toBe("Hello");
	});

	test("handles extremely short max lengths properly (<= 3)", () => {
		// Previously a bug: truncate("Hello", 2) would return "Hell..."
		expect(truncate("Hello", 3)).toBe("Hel");
		expect(truncate("Hello", 2)).toBe("He");
		expect(truncate("Hello", 1)).toBe("H");
		expect(truncate("Hello", 0)).toBe("");
	});

	test("handles whitespace strings correctly", () => {
		expect(truncate("A B C D E", 6)).toBe("A B...");
		expect(truncate("       ", 5)).toBe("  ...");
	});

	test("handles emoji characters (length is determined by visual graphemes)", () => {
		// A rocket emoji "🚀" is 1 grapheme.
		// Slicing "🚀🚀🚀🚀" at 5 characters is 5 <= 4 (length is 4), so it returns "🚀🚀🚀🚀".
		expect(truncate("🚀🚀🚀🚀", 5)).toBe("🚀🚀🚀🚀");
		// Slicing "🚀🚀🚀🚀" at 4 characters is 4 <= 4, so it returns "🚀🚀🚀🚀".
		expect(truncate("🚀🚀🚀🚀", 4)).toBe("🚀🚀🚀🚀");
		// Slicing "🚀🚀🚀🚀" at 3 characters is 3 <= 3, so it returns "🚀🚀🚀".
		expect(truncate("🚀🚀🚀🚀", 3)).toBe("🚀🚀🚀");
		// Slicing "🚀🚀🚀🚀" at 2 characters returns "🚀🚀" because maxLength <= 3 is true.
		expect(truncate("🚀🚀🚀🚀", 2)).toBe("🚀🚀");

		// Slicing "🚀🚀🚀🚀" at 5 with ellipsis (maxLength 5, but input is longer)
		expect(truncate("🚀🚀🚀🚀🚀🚀", 5)).toBe("🚀🚀...");

		// Family emoji "👨‍👩‍👧‍👦" is 1 grapheme.
		expect(truncate("👨‍👩‍👧‍👦", 5)).toBe("👨‍👩‍👧‍👦");
		expect(truncate("👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦", 2)).toBe("👨‍👩‍👧‍👦👨‍👩‍👧‍👦");
	});

	test("truncates exactly on boundaries without duplicating the final character", () => {
		// String length 10, max length 9.
		// slice(0, 6) = "012345", plus "..." = "012345..." -> length 9
		expect(truncate("0123456789", 9)).toBe("012345...");
	});
});
