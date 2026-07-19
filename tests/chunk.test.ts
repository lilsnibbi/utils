import { describe, expect, test } from "bun:test";
import { chunk } from "../src";

describe("chunk", () => {
	test("chunks an array into smaller arrays of specified size (even multiple)", () => {
		expect(chunk([1, 2, 3, 4], 2)).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	test("chunks an array into smaller arrays with a remainder", () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	test("returns an empty array if input array is empty", () => {
		expect(chunk([], 2)).toEqual([]);
		expect(chunk([], 100)).toEqual([]);
	});

	test("returns the whole array as one chunk if size is greater than array length", () => {
		expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
	});

	test("returns the whole array as one chunk if size equals array length", () => {
		expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
	});

	test("handles size of 1 correctly", () => {
		expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
	});

	test("rejects sizes that round below one", () => {
		expect(() => chunk([1, 2, 3], 0)).toThrow("size must be greater than 0");
		expect(() => chunk([1, 2, 3], -1)).toThrow("size must be greater than 0");
		expect(() => chunk([1, 2, 3], 0.9)).toThrow("size must be greater than 0");
	});

	test("rejects non-finite sizes", () => {
		for (const size of [
			Number.NaN,
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
		]) {
			expect(() => chunk([1, 2, 3], size)).toThrow(
				"size must be a finite number",
			);
		}
	});

	test("handles float sizes by slicing up to the floor value correctly during iteration", () => {
		// Enforces integer chunking by flooring 2.5 to 2.
		// Verifies that no array elements are lost in the process.
		const res = chunk([1, 2, 3, 4, 5], 2.5);
		expect(res).toEqual([[1, 2], [3, 4], [5]]);
	});

	test("preserves reference to objects inside chunks", () => {
		const obj = { id: 1 };
		const arr = [obj, { id: 2 }];
		const chunks = chunk(arr, 1);
		expect(chunks[0]?.[0]).toBe(obj);
	});

	test("accepts readonly arrays without mutating them", () => {
		const input = [1, 2, 3] as const;
		expect(chunk(input, 2)).toEqual([[1, 2], [3]]);
		expect(input).toEqual([1, 2, 3]);
	});

	test("works with arrays of various types", () => {
		expect(chunk(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
		expect(chunk([true, false, true], 2)).toEqual([[true, false], [true]]);
		expect(chunk([null, undefined, null], 2)).toEqual([
			[null, undefined],
			[null],
		]);
	});
});
