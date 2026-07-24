import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	spyOn,
	type Mock,
} from "bun:test";
import { createLogger, type Logger } from "../src";

let logger: Logger;
let logSpy: Mock<typeof console.log>;
let warnSpy: Mock<typeof console.warn>;
let errorSpy: Mock<typeof console.error>;
let debugSpy: Mock<typeof console.debug>;

beforeEach(() => {
	logger = createLogger({
		name: "tester",
		timeformat: "en-AU",
	});
	logSpy = spyOn(console, "log").mockImplementation(() => {});
	warnSpy = spyOn(console, "warn").mockImplementation(() => {});
	errorSpy = spyOn(console, "error").mockImplementation(() => {});
	debugSpy = spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
	logSpy.mockRestore();
	warnSpy.mockRestore();
	errorSpy.mockRestore();
	debugSpy.mockRestore();
});

describe("main", () => {
	describe("notif", () => {
		test("prints to console.log with NOTIF label", () => {
			logger.notif("hello");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy.mock.calls[0]?.[0]).toContain("NOTIF");
			expect(logSpy.mock.calls[0]?.[0]).toContain("hello");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.notif("raw test", true);
			expect(logSpy).not.toHaveBeenCalled();
			expect(typeof result).toBe("string");
			expect(result).toContain("raw test");
			expect(result).toContain("NOTIF");
		});
	});

	describe("alert", () => {
		test("prints to console.warn with ALERT label", () => {
			logger.alert("heads up");
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy.mock.calls[0]?.[0]).toContain("ALERT");
			expect(warnSpy.mock.calls[0]?.[0]).toContain("heads up");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.alert("raw alert", true);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(result).toContain("ALERT");
		});
	});

	describe("error", () => {
		test("prints to console.error with ERROR label", () => {
			logger.error("something broke");
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy.mock.calls[0]?.[0]).toContain("ERROR");
			expect(errorSpy.mock.calls[0]?.[0]).toContain("something broke");
		});

		test("logs the Error object", () => {
			const err = new Error("db failed");
			logger.error(err);
			const output = errorSpy.mock.calls[0]?.[0];
			expect(output).toContain("db failed");
			expect(output).toContain("ERROR");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.error("raw error", true);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(result).toContain("ERROR");
		});
	});

	describe("debug", () => {
		test("prints to console.debug with DEBUG label", () => {
			logger.debug("trace info");
			expect(debugSpy).toHaveBeenCalledTimes(1);
			expect(debugSpy.mock.calls[0]?.[0]).toContain("DEBUG");
			expect(debugSpy.mock.calls[0]?.[0]).toContain("trace info");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.debug("raw debug", true);
			expect(debugSpy).not.toHaveBeenCalled();
			expect(result).toContain("DEBUG");
		});
	});

	describe("timestamp format", () => {
		test("matches [Day HH:mm:ss.ms] pattern", () => {
			const output = logger.notif("ts check", true) as string;
			expect(output).toMatch(/\[.*?\d{2}:\d{2}:\d{2}\.\d{3}]/);
		});

		test("milliseconds are zero-padded to 3 digits", () => {
			const output = logger.notif("pad check", true) as string;
			const match = output.match(/\.(\d{3})]/);
			expect(match).not.toBeNull();
			expect(match?.[1]?.length).toBe(3);
		});
	});

	describe("divider", () => {
		test("prints text surrounded by dash lines", () => {
			logger.divider("SECTION");
			expect(logSpy).toHaveBeenCalledTimes(1);
			const output = logSpy.mock.calls[0]?.[0];
			expect(output).toContain("SECTION");
			expect(output).toContain("─");
		});

		test("trims whitespace from text", () => {
			logger.divider("  PADDED  ");
			const output = logSpy.mock.calls[0]?.[0];
			expect(output).toContain("PADDED");
		});

		test("handles empty string", () => {
			logger.divider("");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy.mock.calls[0]?.[0]).toContain("─");
		});
	});

	describe("non-string messages", () => {
		test("numbers are stringified", () => {
			const output = logger.notif(42, true) as string;
			expect(output).toContain("42");
		});

		test("objects are formatted using inspect", () => {
			const output = logger.notif({ key: "val" }, true) as string;
			expect(output).toContain("key");
			expect(output).toContain("val");
			expect(output).not.toContain("[object Object]");
		});

		test("null and undefined are stringified", () => {
			expect(logger.notif(null, true)).toContain("null");
			expect(logger.notif(undefined, true)).toContain("undefined");
		});
	});

	describe("configuration", () => {
		test("filters entries below the active level", () => {
			expect(logger.setLevel("ERROR")).toBe(logger);
			expect(logger.level).toBe("ERROR");

			logger.debug("hidden");
			logger.notif("hidden");
			logger.alert("hidden");
			logger.error("visible");

			expect(debugSpy).not.toHaveBeenCalled();
			expect(logSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(logger.debug("raw output", true)).toContain("raw output");
		});

		test("can omit timestamps", () => {
			const withoutTimestamps = createLogger({
				name: "plain",
				includeTimestamps: false,
			});

			expect(withoutTimestamps.notif("hello", true)).not.toMatch(/^\[/);
		});

		test("can remove node_modules frames from error stacks", () => {
			const filtered = createLogger({
				name: "filtered",
				includeTimestamps: false,
				filterNodeModules: true,
			});
			const error = new Error("failure");
			error.stack = [
				"Error: failure",
				"    at dependency (/project/node_modules/pkg/index.js:1:1)",
				"    at app (/project/src/app.ts:2:3)",
			].join("\n");

			const output = filtered.error(error, true);
			expect(output).not.toContain("node_modules");
			expect(output).toContain("/project/src/app.ts");
		});

		test("supports dynamic levels, child loggers, and structured output", () => {
			const entries: Array<{ level: string; name: string; formatted: string }> =
				[];
			const structured = createLogger({
				name: "app",
				includeTimestamps: false,
				output: (entry) => entries.push(entry),
			});
			const child = structured.child("worker");

			expect(structured.isEnabled("DEBUG")).toBe(true);
			expect(structured.format("ALERT", "careful")).toContain("ALERT");
			child.log("NOTIF", "started");

			expect(entries).toEqual([
				expect.objectContaining({
					level: "NOTIF",
					name: "app:worker",
					formatted: expect.stringContaining("started"),
				}),
			]);
		});
	});
});
