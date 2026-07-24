import { describe, expect, test } from "bun:test";
import { retry, sleep } from "../src";

describe("async helpers", () => {
	test("retries until an operation succeeds", async () => {
		const attempts: number[] = [];
		const result = await retry(
			(attempt) => {
				attempts.push(attempt);
				if (attempt < 3) throw new Error("try again");
				return "done";
			},
			{ attempts: 3 },
		);

		expect(result).toBe("done");
		expect(attempts).toEqual([1, 2, 3]);
	});

	test("supports retry filtering and validates options", async () => {
		await expect(
			retry(
				() => {
					throw new Error("stop");
				},
				{ attempts: 3, shouldRetry: () => false },
			),
		).rejects.toThrow("stop");
		expect(() => retry(() => {}, { attempts: 0 })).toThrow(
			"attempts must be a positive integer",
		);
	});

	test("supports abortable sleep", async () => {
		const controller = new AbortController();
		const pending = sleep(10_000, controller.signal);
		controller.abort(new Error("cancelled"));
		await expect(pending).rejects.toThrow("cancelled");
	});
});
