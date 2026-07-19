import { describe, expect, test } from "bun:test";

describe("package exports", () => {
	test("exposes the root and focused entry points", async () => {
		const [root, discord, error, helpers, logger] = await Promise.all([
			import("@lilsnibbi/utils"),
			import("@lilsnibbi/utils/discord"),
			import("@lilsnibbi/utils/error"),
			import("@lilsnibbi/utils/helpers"),
			import("@lilsnibbi/utils/logger"),
		]);

		expect(root.chunk).toBe(helpers.chunk);
		expect(root.DiscordEvent).toBe(discord.DiscordEvent);
		expect(root.AppError).toBe(error.AppError);
		expect(root.createLogger).toBe(logger.createLogger);
	});
});
