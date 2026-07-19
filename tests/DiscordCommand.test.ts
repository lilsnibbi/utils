import { describe, expect, test } from "bun:test";
import {
	type AutocompleteInteraction,
	type Client,
	SlashCommandBuilder,
} from "discord.js";
import {
	defineCommand,
	type DefinedCommand,
	type DiscordCommandInteraction,
} from "../src";

const client = {} as Client;
const interaction = {} as DiscordCommandInteraction;
const autocompleteInteraction = {} as AutocompleteInteraction;

function createDefinition(): DefinedCommand {
	return {
		data: new SlashCommandBuilder()
			.setName("test")
			.setDescription("Test command"),
		execute: async () => {},
	};
}

describe("defineCommand", () => {
	test("returns the original definition and preserves metadata", () => {
		const definition = {
			...createDefinition(),
			metadata: { cooldown: 5 },
		};
		const command = defineCommand(definition);
		const metadata = command.metadata as { cooldown: number } | undefined;

		expect(command).toBe(definition);
		expect(metadata?.cooldown).toBe(5);
	});

	test("allows optional metadata and autocomplete to be omitted", () => {
		const command = defineCommand(createDefinition());

		expect(command.metadata).toBeUndefined();
		expect(command.autocomplete).toBeUndefined();
	});

	test("preserves autocomplete handlers", () => {
		const autocomplete = async (
			_client: Client,
			_interaction: AutocompleteInteraction,
		) => {};
		const command = defineCommand({
			...createDefinition(),
			autocomplete,
		});

		expect(command.autocomplete).toBe(autocomplete);
	});

	test("does not intercept execute failures", async () => {
		const command = defineCommand({
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
		const command = defineCommand({
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
