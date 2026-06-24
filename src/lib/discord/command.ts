import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export type CommandData =
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| ContextMenuCommandBuilder;

export type DiscordCommandInteraction =
	| ChatInputCommandInteraction
	| ContextMenuCommandInteraction;

// biome-ignore lint/suspicious/noEmptyInterface: Extended by consumers
export interface DiscordCommandMetadata {}

type Metadata = keyof DiscordCommandMetadata extends never
	? Record<string, unknown> | undefined
	: DiscordCommandMetadata;

/**
 * Wraps a discord.js slash or context menu command with typed `execute` and optional `autocomplete` handlers.
 * @typeParam C - The bot's `Client` type.
 *
 * @example To extend the `metadata` types
 * declare module "@lilsnibbi/utils" {
 *     interface DiscordCommandMetadata {
 *         cooldown?: number;
 *         category?: string;
 *     }
 * }
 */
export class DiscordCommand<C extends Client = Client> {
	public readonly data: CommandData;
	public readonly execute: (
		client: C,
		interaction: DiscordCommandInteraction,
	) => Promise<void>;
	public readonly autocomplete?: (
		client: C,
		interaction: AutocompleteInteraction,
	) => Promise<void>;
	public metadata?: Metadata;

	constructor(ops: {
		data: CommandData;
		metadata?: Metadata;
		execute: (
			client: C,
			interaction: DiscordCommandInteraction,
		) => Promise<void>;
		autocomplete?: (
			client: C,
			interaction: AutocompleteInteraction,
		) => Promise<void>;
	}) {
		this.data = ops.data;
		this.metadata = ops.metadata;
		this.execute = ops.execute;
		this.autocomplete = ops.autocomplete;
	}
}
