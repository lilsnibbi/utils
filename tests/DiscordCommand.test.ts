import { describe, expect, expectTypeOf, test } from "bun:test";
import {
	ApplicationCommandType,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type Client,
	SlashCommandBuilder,
	type UserContextMenuCommandInteraction,
} from "discord.js";
import { DiscordCommand, type DiscordCommandInteraction } from "../src";

const client = {} as Client;
const interaction = {} as DiscordCommandInteraction;
const chatInputInteraction = {} as ChatInputCommandInteraction;
const autocompleteInteraction = {} as AutocompleteInteraction;

function createDefinition(): DiscordCommand {
	return {
		data: new SlashCommandBuilder()
			.setName("test")
			.setDescription("Test command"),
		execute: async () => {},
	};
}

describe("DiscordCommand", () => {
	test("creates a command instance and preserves its definition", () => {
		const definition = {
			...createDefinition(),
			metadata: { cooldown: 5 },
		};
		const command = new DiscordCommand(definition);
		const metadata = command.metadata as { cooldown: number } | undefined;

		expect(command).toBeInstanceOf(DiscordCommand);
		expect(command.data).toBe(definition.data);
		expect(command.execute).toBe(definition.execute);
		expect(metadata?.cooldown).toBe(5);
	});

	test("supports direct construction", () => {
		const command = new DiscordCommand({
			data: new SlashCommandBuilder()
				.setName("direct")
				.setDescription("Direct command"),
			execute: async () => {},
		});

		expect(command).toBeInstanceOf(DiscordCommand);
		expect(command.data.toJSON().name).toBe("direct");
	});

	test("allows optional metadata and autocomplete to be omitted", () => {
		const command = new DiscordCommand(createDefinition());

		expect(command.metadata).toBeUndefined();
		expect(command.autocomplete).toBeUndefined();
	});

	test("preserves autocomplete handlers", () => {
		const autocomplete = async (
			_client: Client,
			_interaction: AutocompleteInteraction,
		) => {};
		const command = new DiscordCommand({
			...createDefinition(),
			autocomplete,
		});

		expect(command.autocomplete).toBe(autocomplete);
	});

	test("narrows raw command data to its interaction type", () => {
		const command = new DiscordCommand({
			data: {
				name: "Inspect user",
				type: ApplicationCommandType.User,
			},
			execute: (_client, interaction) => {
				expectTypeOf(
					interaction,
				).toEqualTypeOf<UserContextMenuCommandInteraction>();
			},
		});

		expect(command.data.type).toBe(ApplicationCommandType.User);
	});

	test("accepts synchronous handlers", () => {
		let executed = false;
		const command = new DiscordCommand({
			data: new SlashCommandBuilder()
				.setName("sync")
				.setDescription("Synchronous command"),
			execute: () => {
				executed = true;
			},
		});

		command.execute(client, chatInputInteraction);
		expect(executed).toBe(true);
	});

	test("does not intercept execute failures", async () => {
		const command = new DiscordCommand({
			...createDefinition(),
			execute: async () => {
				throw new Error("execute failure");
			},
		});

		await expect(command.execute(client, interaction)).rejects.toThrow(
			"execute failure",
		);
	});

	test("does not intercept autocomplete failures", async () => {
		const command = new DiscordCommand({
			...createDefinition(),
			autocomplete: async () => {
				throw new Error("autocomplete failure");
			},
		});

		await expect(
			command.autocomplete?.(client, autocompleteInteraction),
		).rejects.toThrow("autocomplete failure");
	});
});
