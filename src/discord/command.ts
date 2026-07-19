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

/** A discord.js builder accepted by {@link defineCommand}. */
export type CommandData =
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| ContextMenuCommandBuilder;

/** An interaction handled by an application command. */
export type DiscordCommandInteraction =
	| ChatInputCommandInteraction
	| ContextMenuCommandInteraction;

/** Consumer-augmentable metadata attached to commands. */
// biome-ignore lint/suspicious/noEmptyInterface: Intentionally extended by consumers.
export interface DiscordCommandMetadata {}

/** Metadata shape accepted by {@link defineCommand}. */
export type CommandMetadata = keyof DiscordCommandMetadata extends never
	? Record<string, unknown> | undefined
	: DiscordCommandMetadata;

/** Definition of a Discord application command. */
export interface DefinedCommand<C extends Client = Client> {
	/** Slash or context-menu command data registered with Discord. */
	data: CommandData;
	/** Handles the command interaction. */
	execute: (client: C, interaction: DiscordCommandInteraction) => Promise<void>;
	/** Handles autocomplete interactions for the command. */
	autocomplete?: (
		client: C,
		interaction: AutocompleteInteraction,
	) => Promise<void>;
	/** Optional consumer-defined metadata. */
	metadata?: CommandMetadata;
}

/**
 * Defines a Discord application command while preserving its inferred types.
 *
 * @typeParam C - The concrete discord.js client type.
 * @param options - The command definition.
 * @returns The same command definition object.
 */
export function defineCommand<C extends Client = Client>(
	options: DefinedCommand<C>,
): DefinedCommand<C> {
	return options;
}
