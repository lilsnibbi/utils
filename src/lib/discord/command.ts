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

export interface DefinedCommand<C extends Client = Client> {
	data: CommandData;
	execute: (client: C, interaction: DiscordCommandInteraction) => Promise<void>;
	autocomplete?: (
		client: C,
		interaction: AutocompleteInteraction,
	) => Promise<void>;
	metadata?: Metadata;
}

export function defineCommand<C extends Client = Client>(
	ops: DefinedCommand<C>,
): DefinedCommand<C> {
	return {
		data: ops.data,
		metadata: ops.metadata,
		execute: ops.execute,
		autocomplete: ops.autocomplete,
	};
}
