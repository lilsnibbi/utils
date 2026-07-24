import { describe, expect, test } from "bun:test";

describe("package exports", () => {
	test("exposes the root and focused entry points", async () => {
		const [
			root,
			discord,
			command,
			components,
			event,
			pagination,
			error,
			helpers,
			logger,
		] = await Promise.all([
			import("@lilsnibbi/utils"),
			import("@lilsnibbi/utils/discord"),
			import("@lilsnibbi/utils/discord/command"),
			import("@lilsnibbi/utils/discord/components"),
			import("@lilsnibbi/utils/discord/event"),
			import("@lilsnibbi/utils/discord/pagination"),
			import("@lilsnibbi/utils/error"),
			import("@lilsnibbi/utils/helpers"),
			import("@lilsnibbi/utils/logger"),
		]);

		expect(root.chunk).toBe(helpers.chunk);
		expect(root.DiscordEvent).toBe(discord.DiscordEvent);
		expect(discord.DiscordCommand).toBe(command.DiscordCommand);
		expect(discord.DiscordEvent).toBe(event.DiscordEvent);
		expect(discord.PaginationBuilder).toBe(pagination.PaginationBuilder);
		expect("Button" in discord).toBe(false);
		expect(typeof components.Button).toBe("function");
		expect(root.AppError).toBe(error.AppError);
		expect(root.createLogger).toBe(logger.createLogger);
	});
});
