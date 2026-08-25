import type {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ChannelSelectMenuBuilder,
	ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	MentionableSelectMenuBuilder,
	Message,
	RoleSelectMenuBuilder,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
} from "discord.js";

/** Any builder discord.js accepts as an application command definition. */
export type CommandData =
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| ContextMenuCommandBuilder;

/** Interactions a command's `execute` handler can receive. */
export type CommandInteraction =
	| ChatInputCommandInteraction
	| ContextMenuCommandInteraction;

/** Any of the five select menu builders discord.js ships. */
export type AnySelectMenuBuilder =
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder
	| RoleSelectMenuBuilder
	| ChannelSelectMenuBuilder
	| MentionableSelectMenuBuilder;

/** An action row holding any interactive message component. */
export type MessageActionRow = ActionRowBuilder<
	ButtonBuilder | AnySelectMenuBuilder
>;

/** Interactions a pagination can attach itself to. */
export type PaginationInteraction =
	| ButtonInteraction
	| ChatInputCommandInteraction;

/** Anything a pagination can be sent in reply to. */
export type PaginationTarget = PaginationInteraction | Message;
