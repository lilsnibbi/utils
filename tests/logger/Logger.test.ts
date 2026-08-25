/** biome-ignore-all lint/suspicious/noExplicitAny: test spies */
import { afterEach, beforeEach, describe, expect, test, spyOn } from "bun:test";
import { LoggerModule } from "../../src/logger";

let logger: LoggerModule;
let logSpy: any;
let warnSpy: any;
let errorSpy: any;
let debugSpy: any;

beforeEach(() => {
	logger = new LoggerModule({
		name: "tester",
		timeformat: "en-AU"
	});
	logSpy = spyOn(console, "log").mockImplementation(() => { });
	warnSpy = spyOn(console, "warn").mockImplementation(() => { });
	errorSpy = spyOn(console, "error").mockImplementation(() => { });
	debugSpy = spyOn(console, "debug").mockImplementation(() => { });
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
			logger.log("NOTIF", "hello");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy.mock.calls[0][0]).toContain("NOTIF");
			expect(logSpy.mock.calls[0][0]).toContain("hello");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.log("NOTIF", "raw test", true);
			expect(logSpy).not.toHaveBeenCalled();
			expect(typeof result).toBe("string");
			expect(result).toContain("raw test");
			expect(result).toContain("NOTIF");
		});
	});

	describe("alert", () => {
		test("prints to console.warn with ALERT label", () => {
			logger.log("ALERT", "heads up");
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy.mock.calls[0][0]).toContain("ALERT");
			expect(warnSpy.mock.calls[0][0]).toContain("heads up");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.log("ALERT", "raw alert", true);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(result).toContain("ALERT");
		});
	});

	describe("error", () => {
		test("prints to console.error with ERROR label", () => {
			logger.log("ERROR", "something broke");
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy.mock.calls[0][0]).toContain("ERROR");
			expect(errorSpy.mock.calls[0][0]).toContain("something broke");
		});

		test("logs the Error object", () => {
			const err = new Error("db failed");
			logger.log("ERROR", err);
			const output = errorSpy.mock.calls[0][0];
			expect(output.message).toContain("db failed");
			expect(output.message).toContain("ERROR");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.log("ERROR", "raw error", true);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(result).toContain("ERROR");
		});
	});

	describe("debug", () => {
		test("prints to console.debug with DEBUG label", () => {
			logger.log("DEBUG", "trace info");
			expect(debugSpy).toHaveBeenCalledTimes(1);
			expect(debugSpy.mock.calls[0][0]).toContain("DEBUG");
			expect(debugSpy.mock.calls[0][0]).toContain("trace info");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.log("DEBUG", "raw debug", true);
			expect(debugSpy).not.toHaveBeenCalled();
			expect(result).toContain("DEBUG");
		});
	});

	describe("timestamp format", () => {
		test("matches [Day HH:mm:ss.ms] pattern", () => {
			const output = logger.log("NOTIF", "ts check", true) as string;
			expect(output).toMatch(/\[.*?\d{2}:\d{2}:\d{2}\.\d{3}]/);
		});

		test("milliseconds are zero-padded to 3 digits", () => {
			const output = logger.log("NOTIF", "pad check", true) as string;
			const match = output.match(/\.(\d{3})]/);
			expect(match).not.toBeNull();
			expect(match?.[1]?.length).toBe(3);
		});
	});

	describe("divider", () => {
		test("prints text surrounded by dash lines", () => {
			logger.divider("SECTION");
			expect(logSpy).toHaveBeenCalledTimes(1);
			const output = logSpy.mock.calls[0][0];
			expect(output).toContain("SECTION");
			expect(output).toContain("─");
		});

		test("trims whitespace from text", () => {
			logger.divider("  PADDED  ");
			const output = logSpy.mock.calls[0][0];
			expect(output).toContain("PADDED");
		});

		test("handles empty string", () => {
			logger.divider("");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy.mock.calls[0][0]).toContain("─");
		});
	});

	describe("non-string messages", () => {
		test("numbers are stringified", () => {
			const output = logger.log("NOTIF", 42, true) as string;
			expect(output).toContain("42");
		});

		test("objects are formatted using inspect", () => {
			const output = logger.log("NOTIF", { key: "val" }, true) as string;
			expect(output).toContain("key");
			expect(output).toContain("val");
			expect(output).not.toContain("[object Object]");
		});

		test("null and undefined are stringified", () => {
			expect(logger.log("NOTIF", null, true)).toContain("null");
			expect(logger.log("NOTIF", undefined, true)).toContain("undefined");
		});
	});
});
