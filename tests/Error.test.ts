import { describe, expect, test } from "bun:test";
import { AppError } from "../src";

declare module "../src/error/Error" {
	interface AppErrorCodes {
		TestCode: true;
	}
}

describe("AppError", () => {
	test("should instantiate with basic message and code", () => {
		const error = new AppError("Test message", "TestCode");
		expect(error.message).toBe("Test message");
		expect(error.code).toBe("TestCode");
		expect(error.name).toBe("AppError");
	});

	test("should be an instance of Error and AppError", () => {
		const error = new AppError("Test message", "TestCode");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(AppError);
	});

	test("should have default meta with omitStack: true", () => {
		const error = new AppError("Test message", "TestCode");
		expect(error.meta?.omitStack).toBe(true);
		expect(error.stack).toBeUndefined();
	});

	test("should allow overriding omitStack to false", () => {
		const error = new AppError("Test message", "TestCode", {
			omitStack: false,
		});
		expect(error.meta?.omitStack).toBe(false);
		expect(error.stack).toBeDefined();
	});

	test("should store additional meta properties", () => {
		const meta = {
			reason: "Some reason",
			source: "file.ts",
			context: "some context",
			omitStack: true,
		};
		const error = new AppError("Test message", "TestCode", meta);
		expect(error.meta?.reason).toBe("Some reason");
		expect(error.meta?.source).toBe("file.ts");
		expect(error.meta?.context).toBe("some context");
	});

	test("should capture the cause in the meta and parent Error", () => {
		const cause = new Error("Original cause");
		const error = new AppError("Test message", "TestCode", {
			cause,
			omitStack: true,
		});
		expect(error.meta?.cause).toBe(cause);
		expect(error.cause).toBe(cause);
	});

	test("should correctly merge meta defaults", () => {
		const error = new AppError("Test message", "TestCode", { reason: "test" });
		expect(error.meta?.omitStack).toBe(true);
		expect(error.meta?.reason).toBe("test");
		expect(Object.isFrozen(error.meta)).toBe(true);
	});
});
