import { describe, expect, test } from "bun:test";
import { Client, SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "../src";

describe("DiscordCommand", () => {
	test("should instantiate a command with data, execute and metadata", () => {
		const data = new SlashCommandBuilder().setName("test").setDescription("test cmd");
		const execute = async (_client: Client, _interaction: any) => {};
		const command = new DiscordCommand({
			data,
			execute,
			metadata: { cooldown: 5 }
		});

		expect(command.data).toBe(data);
		expect(command.execute).toBe(execute);
		expect(command.metadata?.["cooldown"]).toBe(5);
	});

	test("should allow omitting optional metadata", () => {
		const data = new SlashCommandBuilder().setName("test").setDescription("test cmd");
		const execute = async (_client: Client, _interaction: any) => {};
		const command = new DiscordCommand({
			data,
			execute
		});

		expect(command.metadata).toBeUndefined();
	});
});
