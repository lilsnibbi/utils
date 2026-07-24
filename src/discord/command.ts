import type {
	AutocompleteInteraction,
	ChatInputApplicationCommandData,
	ChatInputCommandInteraction,
	Client,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	MessageApplicationCommandData,
	MessageContextMenuCommandInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
	UserApplicationCommandData,
	UserContextMenuCommandInteraction,
} from "discord.js";

/** Chat-input command data accepted by {@link DiscordCommand}. */
export type DiscordChatInputCommandData =
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| ChatInputApplicationCommandData;

/** Context-menu command data accepted by {@link DiscordCommand}. */
export type DiscordContextMenuCommandData =
	| ContextMenuCommandBuilder
	| UserApplicationCommandData
	| MessageApplicationCommandData;

/** Any application-command data accepted by {@link DiscordCommand}. */
export type DiscordCommandData =
	| DiscordChatInputCommandData
	| DiscordContextMenuCommandData;

/** @deprecated Use {@link DiscordCommandData}. */
export type CommandData = DiscordCommandData;

/** An interaction handled by an application command. */
export type DiscordCommandInteraction<
	D extends DiscordCommandData = DiscordCommandData,
> = D extends DiscordChatInputCommandData
	? ChatInputCommandInteraction
	: D extends UserApplicationCommandData
		? UserContextMenuCommandInteraction
		: D extends MessageApplicationCommandData
			? MessageContextMenuCommandInteraction
			: ContextMenuCommandInteraction;

/** Consumer-augmentable metadata attached to commands. */
// biome-ignore lint/suspicious/noEmptyInterface: Intentionally extended by consumers.
export interface DiscordCommandMetadata {}

/** Metadata shape accepted by {@link DiscordCommand}. */
export type CommandMetadata = keyof DiscordCommandMetadata extends never
	? Record<string, unknown> | undefined
	: DiscordCommandMetadata;

/** Handler for a typed Discord application command. */
export type DiscordCommandHandler<
	C extends Client,
	D extends DiscordCommandData,
> = (
	client: C,
	interaction: DiscordCommandInteraction<D>,
) => void | Promise<void>;

/** Autocomplete handler for a chat-input command. */
export type DiscordCommandAutocompleteHandler<C extends Client> = (
	client: C,
	interaction: AutocompleteInteraction,
) => void | Promise<void>;

/** Options for constructing a {@link DiscordCommand}. */
export type DiscordCommandOptions<
	C extends Client = Client,
	D extends DiscordCommandData = DiscordCommandData,
	M extends CommandMetadata = CommandMetadata,
> = {
	/** Slash or context-menu command data registered with Discord. */
	data: D;
	/** Handles the command interaction. */
	execute: DiscordCommandHandler<C, D>;
	/** Optional consumer-defined metadata. */
	metadata?: M;
} & (D extends DiscordChatInputCommandData
	? {
			/** Handles autocomplete interactions for a chat-input command. */
			autocomplete?: DiscordCommandAutocompleteHandler<C>;
		}
	: {
			/** Autocomplete is unavailable for context-menu commands. */
			autocomplete?: never;
		});

/** Wraps a typed Discord application command definition. */
export class DiscordCommand<
	C extends Client = Client,
	D extends DiscordCommandData = DiscordCommandData,
	M extends CommandMetadata = CommandMetadata,
> {
	public readonly data: D;
	public readonly execute: DiscordCommandHandler<C, D>;
	public readonly autocomplete?: DiscordCommandAutocompleteHandler<C>;
	public readonly metadata?: M;

	/** Creates a typed command definition. */
	constructor(options: DiscordCommandOptions<C, D, M>) {
		this.data = options.data;
		this.execute = options.execute;
		this.autocomplete = options.autocomplete;
		this.metadata = options.metadata;
	}
}

/** @deprecated Use {@link DiscordCommand}. */
export type DefinedCommand<C extends Client = Client> = DiscordCommand<C>;
