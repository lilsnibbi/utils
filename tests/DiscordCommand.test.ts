import { describe, expect, test } from "bun:test";
import { Client, SlashCommandBuilder } from "discord.js";
import { defineCommand } from "../src";

describe("defineCommand", () => {
	test("should instantiate a command with data, execute and metadata", () => {
		const data = new SlashCommandBuilder().setName("test").setDescription("test cmd");
		const execute = async (_client: Client, _interaction: any) => {};
		const command = defineCommand({
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
		const command = defineCommand({
			data,
			execute
		});

		expect(command.metadata).toBeUndefined();
	});

	test("should bubble up errors thrown in execute", async () => {
		const data = new SlashCommandBuilder().setName("test").setDescription("test cmd");
		const execute = async (_client: Client, _interaction: any) => {
			throw new Error("Execute error");
		};
		const command = defineCommand({
			data,
			execute
		});

		await expect(command.execute({} as Client, {} as any)).rejects.toThrow("Execute error");
	});

	test("should allow omitting optional autocomplete", () => {
		const data = new SlashCommandBuilder().setName("test").setDescription("test cmd");
		const execute = async (_client: Client, _interaction: any) => {};
		const command = defineCommand({
			data,
			execute
		});

		expect(command.autocomplete).toBeUndefined();
	});

	test("should instantiate a command with autocomplete", () => {
		const data = new SlashCommandBuilder().setName("test").setDescription("test cmd");
		const execute = async (_client: Client, _interaction: any) => {};
		const autocomplete = async (_client: Client, _interaction: any) => {};
		const command = defineCommand({
			data,
			execute,
			autocomplete
		});

		expect(command.autocomplete).toBe(autocomplete);
	});

	test("should bubble up errors thrown in autocomplete", async () => {
		const data = new SlashCommandBuilder().setName("test").setDescription("test cmd");
		const execute = async (_client: Client, _interaction: any) => {};
		const autocomplete = async (_client: Client, _interaction: any) => {
			throw new Error("Autocomplete error");
		};
		const command = defineCommand({
			data,
			execute,
			autocomplete
		});

		await expect(command.autocomplete?.({} as Client, {} as any)).rejects.toThrow("Autocomplete error");
	});
});
