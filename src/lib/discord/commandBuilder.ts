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

export interface DiscordCommandMetadata extends Record<string, unknown> {}

type DefaultMetadata<T> = keyof T extends never
	? { "No metadata values in types": never }
	: T;

type Metadata = DefaultMetadata<DiscordCommandMetadata>;

/**
 * Wraps a discord.js slash or context menu command with typed `execute` and optional `autocomplete` handlers.
 * @typeParam C - The bot's `Client` type. Inferred from args[0] in `method`.
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
	public metadata: Metadata;

	constructor(ops: {
		data: CommandData;
		metadata: Metadata;
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
