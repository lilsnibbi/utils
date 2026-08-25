import {
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	spyOn,
	test,
} from "bun:test";
import { Logger } from "../../src/logger";

type ConsoleSpy = Mock<(...args: unknown[]) => void>;

let logger: Logger;
let logSpy: ConsoleSpy;
let warnSpy: ConsoleSpy;
let errorSpy: ConsoleSpy;
let debugSpy: ConsoleSpy;

/** First argument of the first call, as a string. */
function firstArg(spy: ConsoleSpy): string {
	const args = spy.mock.calls[0];
	if (!args) throw new Error("spy was never called");
	return String(args[0]);
}

/** First argument of the first call, asserted to be an `Error`. */
function firstError(spy: ConsoleSpy): Error {
	const args = spy.mock.calls[0];
	if (!args) throw new Error("spy was never called");
	if (!(args[0] instanceof Error)) throw new Error("expected an Error");
	return args[0];
}

beforeEach(() => {
	logger = new Logger({ name: "tester", timeformat: "en-AU" });
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

describe("Logger", () => {
	describe("notif", () => {
		test("prints to console.log with NOTIF label", () => {
			logger.notif("hello");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(firstArg(logSpy)).toContain("NOTIF");
			expect(firstArg(logSpy)).toContain("hello");
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
			expect(firstArg(warnSpy)).toContain("ALERT");
			expect(firstArg(warnSpy)).toContain("heads up");
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
			expect(firstArg(errorSpy)).toContain("ERROR");
			expect(firstArg(errorSpy)).toContain("something broke");
		});

		test("logs the Error object", () => {
			logger.error(new Error("db failed"));
			const output = firstError(errorSpy);
			expect(output.message).toContain("db failed");
			expect(output.message).toContain("ERROR");
		});

		test("raw flag returns the sanitised stack", () => {
			const result = logger.error(new Error("db failed"), true);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(result).toContain("db failed");
			expect(result).toContain("└─");
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
			expect(firstArg(debugSpy)).toContain("DEBUG");
			expect(firstArg(debugSpy)).toContain("trace info");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.debug("raw debug", true);
			expect(debugSpy).not.toHaveBeenCalled();
			expect(result).toContain("DEBUG");
		});
	});

	describe("log", () => {
		test("routes each level to its console method", () => {
			logger.log("DEBUG", "d");
			logger.log("NOTIF", "n");
			logger.log("ALERT", "a");
			logger.log("ERROR", "e");
			expect(debugSpy).toHaveBeenCalledTimes(1);
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("level filtering", () => {
		test("drops messages below the configured level", () => {
			logger.setLevel("ALERT");
			logger.debug("dropped");
			logger.notif("dropped");
			logger.alert("kept");
			logger.error("kept");
			expect(debugSpy).not.toHaveBeenCalled();
			expect(logSpy).not.toHaveBeenCalled();
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});

		test("returns undefined for a filtered raw call", () => {
			logger.setLevel("ERROR");
			expect(logger.notif("dropped", true)).toBeUndefined();
		});

		test("setLevel returns the logger for chaining", () => {
			expect(logger.setLevel("NOTIF")).toBe(logger);
			expect(logger.level).toBe("NOTIF");
		});
	});

	describe("timestamps", () => {
		test("matches the [Day HH:mm:ss.ms] pattern", () => {
			const output = logger.notif("ts check", true);
			expect(output).toMatch(/\[.*?\d{2}:\d{2}:\d{2}\.\d{3}]/);
		});

		test("milliseconds are zero-padded to 3 digits", () => {
			const output = logger.notif("pad check", true);
			const match = output?.match(/\.(\d{3})]/);
			expect(match).not.toBeNull();
			expect(match?.[1]?.length).toBe(3);
		});

		test("are omitted when includeTimestamps is false", () => {
			const quiet = new Logger({ name: "quiet", includeTimestamps: false });
			expect(quiet.notif("no ts", true)).not.toMatch(/\d{2}:\d{2}:\d{2}/);
		});
	});

	describe("divider", () => {
		test("prints text surrounded by dash lines", () => {
			logger.divider("SECTION");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(firstArg(logSpy)).toContain("SECTION");
			expect(firstArg(logSpy)).toContain("─");
		});

		test("trims whitespace from text", () => {
			logger.divider("  PADDED  ");
			expect(firstArg(logSpy)).toContain("PADDED");
		});

		test("handles empty string", () => {
			logger.divider("");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(firstArg(logSpy)).toContain("─");
		});
	});

	describe("non-string messages", () => {
		test("numbers are stringified", () => {
			expect(logger.notif(42, true)).toContain("42");
		});

		test("objects are formatted using inspect", () => {
			const output = logger.notif({ key: "val" }, true);
			expect(output).toContain("key");
			expect(output).toContain("val");
			expect(output).not.toContain("[object Object]");
		});

		test("null and undefined are stringified", () => {
			expect(logger.notif(null, true)).toContain("null");
			expect(logger.notif(undefined, true)).toContain("undefined");
		});
	});
});
