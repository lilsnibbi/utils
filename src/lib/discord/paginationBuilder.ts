import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type ChannelSelectMenuBuilder,
	type ChatInputCommandInteraction,
	ComponentType,
	ContainerBuilder,
	EmbedBuilder,
	FileBuilder,
	LabelBuilder,
	MediaGalleryBuilder,
	type MentionableSelectMenuBuilder,
	type Message,
	ModalBuilder,
	type RoleSelectMenuBuilder,
	SectionBuilder,
	SeparatorBuilder,
	type StringSelectMenuBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
	type UserSelectMenuBuilder,
} from "discord.js";

/** An action row containing any interactive message component. */
export type PaginationMessageActionRow = ActionRowBuilder<
	| ButtonBuilder
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder
	| RoleSelectMenuBuilder
	| ChannelSelectMenuBuilder
	| MentionableSelectMenuBuilder
>;

export const BUTTONS_SYMBOL: unique symbol = Symbol("pagination-buttons");
export const DATA_SYMBOL: unique symbol = Symbol("pagination-data");

/** Valid component types that can appear in a pagination page layout. */
export type PaginationInput =
	| string
	| TextDisplayBuilder
	| SectionBuilder
	| SeparatorBuilder
	| FileBuilder
	| MediaGalleryBuilder
	| PaginationMessageActionRow
	| typeof BUTTONS_SYMBOL
	| typeof DATA_SYMBOL;

export type PaginationInternalComponent =
	| { type: "buttons" }
	| { type: "data" }
	| { type: "display"; component: TextDisplayBuilder }
	| { type: "section"; component: SectionBuilder }
	| { type: "separator"; component: SeparatorBuilder }
	| { type: "file"; component: FileBuilder }
	| { type: "gallery"; component: MediaGalleryBuilder }
	| { type: "actionrow"; component: PaginationMessageActionRow };

export interface PaginationButtonConfig {
	label?: string;
	emoji?: string;
	style?: ButtonStyle;
}

export interface PaginationButtonOptions {
	first?: PaginationButtonConfig;
	back?: PaginationButtonConfig;
	next?: PaginationButtonConfig;
	last?: PaginationButtonConfig;
	jump?: PaginationButtonConfig;
}

/** Shared options for all pagination modes. */
export interface PaginationBaseOptions {
	/** Number of list entries shown per page (default: 5). */
	entriesPerPage?: number;
	/** Key-value pairs replaced in rendered content. */
	replacements?: Record<string, string>;
	/** Whether the pagination message is ephemeral. */
	ephemeral?: boolean;
	/** Idle timeout in milliseconds (default: 60,000). */
	idleTimeout?: number;
	/** Custom button labels/emojis/styles. */
	buttons?: PaginationButtonOptions;
	/** Whether to show "First" and "Last" buttons. */
	showSkipButtons?: boolean;
	/** Callback when the collector ends. */
	onEnd?: (
		interaction?: ButtonInteraction | ChatInputCommandInteraction,
	) => void | Promise<void>;
}

/**
 * Options for **container** mode (Components V2).
 * Uses a `ContainerBuilder`-based layout with the `IsComponentsV2` message flag.
 */
export interface PaginationContainerOptions extends PaginationBaseOptions {
	/** Selects container mode. */
	type: "container";
	/** Single layout template using sentinels `PaginationBuilder.DATA` and `PaginationBuilder.BUTTONS`. */
	layout: PaginationInput[];
	/** Container accent color. */
	accentColor?: number;
	/** Whether the container is a spoiler. */
	spoiler?: boolean;
}

/**
 * Options for **embed** mode.
 * Uses a standard `EmbedBuilder` with an `ActionRow` for navigation buttons.
 * The embed's `description` and `footer` are reserved for page data and the page counter.
 */
export interface PaginationEmbedOptions extends PaginationBaseOptions {
	/** Selects embed mode. */
	type: "embed";
	/** EmbedBuilder template. Description and footer are overwritten per page. */
	embed: EmbedBuilder;
}

/** Discriminated union of all pagination option types. Use the `type` field to select a mode. */
export type PaginationOptions =
	| PaginationContainerOptions
	| PaginationEmbedOptions;

/**
 * Discord paginator supporting both **Components V2** (`ContainerBuilder`) and
 * **Embed** (`EmbedBuilder`) modes.
 *
 * @example Container mode
 * ```ts
 * const pagination = new PaginationBuilder(entries, {
 *     type: "container",
 *     layout: [
 *         "# Leaderboard",
 *         new SeparatorBuilder(),
 *         PaginationBuilder.DATA,
 *         new SeparatorBuilder(),
 *         PaginationBuilder.BUTTONS,
 *     ],
 *     entriesPerPage: 5,
 *     accentColor: 0x5865f2,
 * });
 * ```
 *
 * @example Embed mode
 * ```ts
 * const pagination = new PaginationBuilder(entries, {
 *     type: "embed",
 *     embed: new EmbedBuilder().setTitle("Leaderboard").setColor(0x5865f2),
 *     entriesPerPage: 5,
 * });
 * ```
 */
export class PaginationBuilder {
	/** Marks where the pagination buttons should render. */
	static readonly BUTTONS: typeof BUTTONS_SYMBOL = BUTTONS_SYMBOL;
	/** Marks where the paginated list entries should render. */
	static readonly DATA: typeof DATA_SYMBOL = DATA_SYMBOL;

	private readonly list: string[];
	private readonly entriesPerPage: number;
	private readonly replacements?: Record<string, string>;
	private readonly ephemeral: boolean;
	private readonly prefix: string;
	private readonly totalPages: number;
	private readonly mode: "container" | "embed";
	private readonly idleTimeout: number;
	private readonly buttonOptions?: PaginationButtonOptions;
	private readonly showSkipButtons: boolean;
	private readonly onEnd?: (
		interaction?: ButtonInteraction | ChatInputCommandInteraction,
	) => void | Promise<void>;

	// Container mode
	private readonly layout?: PaginationInternalComponent[];
	private readonly accentColor?: number;
	private readonly spoiler?: boolean;

	// Embed mode
	private readonly embedTemplate?: EmbedBuilder;

	// Runtime state
	private currentIndex = 0;
	private ended = false;
	private isMessage = false;
	private interaction?: ButtonInteraction | ChatInputCommandInteraction;
	private replyMessage?: Message;

	constructor(list: string[], options: PaginationOptions) {
		const {
			entriesPerPage = 5,
			replacements,
			ephemeral = false,
			idleTimeout = 60_000,
			buttons,
			showSkipButtons = false,
			onEnd,
		} = options;

		if (entriesPerPage <= 0)
			throw new Error("entriesPerPage must be greater than 0");

		this.list = list;
		this.entriesPerPage = entriesPerPage;
		this.replacements = replacements;
		this.ephemeral = ephemeral;
		this.idleTimeout = idleTimeout;
		this.buttonOptions = buttons;
		this.showSkipButtons = showSkipButtons;
		this.onEnd = onEnd;
		this.prefix = `~PAGINATION_${crypto.randomUUID()}_`;
		this.totalPages = Math.ceil(list.length / entriesPerPage);

		this.mode = options.type;

		if (options.type === "container") {
			this.layout = options.layout.map((input) => this.normalize(input));
			this.accentColor = options.accentColor;
			this.spoiler = options.spoiler;
		} else {
			this.embedTemplate = options.embed;
		}
	}

	/**
	 * Sends the paginated message and starts the button collector.
	 * @param target - The interaction or message to reply to.
	 */
	public async send(
		target: ButtonInteraction | ChatInputCommandInteraction | Message,
	): Promise<void> {
		this.isMessage = !("deferReply" in target);
		const userId = this.isMessage
			? (target as Message).author.id
			: (target as ButtonInteraction | ChatInputCommandInteraction).user.id;

		if (!this.list.length) {
			await this.sendEmpty(target);
			return;
		}

		if (this.isMessage) {
			this.replyMessage = await (target as Message).reply(this.buildPayload());
		} else {
			const interaction = target as
				| ButtonInteraction
				| ChatInputCommandInteraction;
			this.interaction = interaction;

			if (!interaction.replied && !interaction.deferred) {
				const response = await interaction
					.deferReply({
						withResponse: true,
						flags: this.ephemeral ? ["Ephemeral"] : [],
					})
					.catch(() => null);
				this.replyMessage =
					response?.resource?.message ??
					(await interaction.fetchReply().catch(() => undefined));
			} else {
				this.replyMessage = await interaction
					.fetchReply()
					.catch(() => undefined);
			}

			await this.render();
		}

		if (!this.replyMessage) return;

		const collector = this.replyMessage.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: this.idleTimeout,
		});

		collector.on("collect", async (btn) => {
			if (btn.user.id !== userId) {
				return void btn.deferUpdate();
			}
			if (!btn.customId.startsWith(this.prefix)) return;

			this.ended = false;
			collector.resetTimer();

			if (btn.customId === `${this.prefix}info`) {
				await this.handlePageJump(btn);
			} else if (btn.customId === `${this.prefix}first`) {
				this.currentIndex = 0;
			} else if (btn.customId === `${this.prefix}last`) {
				this.currentIndex = (this.totalPages - 1) * this.entriesPerPage;
			} else {
				this.currentIndex +=
					btn.customId === `${this.prefix}back`
						? -this.entriesPerPage
						: this.entriesPerPage;
				this.currentIndex = Math.max(
					0,
					Math.min(
						this.currentIndex,
						(this.totalPages - 1) * this.entriesPerPage,
					),
				);
			}

			if (btn.customId !== `${this.prefix}info`) {
				await btn.deferUpdate().catch(() => {});
			}

			await this.render();
		});

		collector.on("end", async () => {
			this.ended = true;
			await this.render();
			if (this.onEnd) await this.onEnd(this.interaction);
		});
	}

	private async sendEmpty(
		target: ButtonInteraction | ChatInputCommandInteraction | Message,
	): Promise<void> {
		if (this.mode === "embed" && !this.embedTemplate)
			throw new Error(
				"[@lilsnibbi/utils]: Pagination: embedTemplate is in a corrupted state",
			);

		const allowedMentions = { parse: [] as const, repliedUser: false };
		const isEphemeral = !this.isMessage && this.ephemeral;

		const payload =
			this.mode === "container"
				? {
						components: [
							new ContainerBuilder().addTextDisplayComponents(
								new TextDisplayBuilder().setContent("No data to show"),
							),
						],
						flags: isEphemeral
							? (["Ephemeral", "IsComponentsV2"] as const)
							: (["IsComponentsV2"] as const),
						allowedMentions,
					}
				: {
						embeds: [
							new EmbedBuilder(this.embedTemplate?.toJSON()).setDescription(
								"No data to show",
							),
						],
						...(isEphemeral && { flags: ["Ephemeral"] as const }),
						allowedMentions,
					};

		if (this.isMessage) {
			await (target as Message)
				.reply(
					payload as
						| string
						| import("discord.js").MessagePayload
						| import("discord.js").MessageReplyOptions,
				)
				.catch(() => {});
		} else {
			await (target as ButtonInteraction | ChatInputCommandInteraction)
				.reply(
					payload as
						| string
						| import("discord.js").MessagePayload
						| import("discord.js").InteractionReplyOptions,
				)
				.catch(() => {});
		}
	}

	private normalize(input: PaginationInput): PaginationInternalComponent {
		if (input === BUTTONS_SYMBOL) return { type: "buttons" };
		if (input === DATA_SYMBOL) return { type: "data" };
		if (typeof input === "string")
			return {
				type: "display",
				component: new TextDisplayBuilder().setContent(input),
			};
		if (input instanceof TextDisplayBuilder)
			return { type: "display", component: input };
		if (input instanceof SeparatorBuilder)
			return { type: "separator", component: input };
		if (input instanceof SectionBuilder)
			return { type: "section", component: input };
		if (input instanceof FileBuilder) return { type: "file", component: input };
		if (input instanceof MediaGalleryBuilder)
			return { type: "gallery", component: input };
		return { type: "actionrow", component: input };
	}

	private buildPayload() {
		if (this.mode === "embed") {
			return {
				embeds: [this.generateEmbed()],
				components: [this.getPaginationRow()],
				allowedMentions: { parse: [] as const, repliedUser: false },
			};
		}

		return {
			components: [this.generateContainer()],
			flags: ["IsComponentsV2"] as const,
			allowedMentions: { parse: [] as const, repliedUser: false },
		};
	}

	private generateContainer(): ContainerBuilder {
		if (!this.layout)
			throw new Error(
				"[@lilsnibbi/utils]: Pagination: layout is in a corrupted state",
			);

		const page = Math.floor(this.currentIndex / this.entriesPerPage);

		return new ContainerBuilder({
			components: this.layout.map((comp) => {
				switch (comp.type) {
					case "buttons":
						return this.getPaginationRow().toJSON();

					case "data": {
						const content = this.list
							.slice(
								page * this.entriesPerPage,
								(page + 1) * this.entriesPerPage,
							)
							.join("\n");
						return new TextDisplayBuilder()
							.setContent(this.applyReplacements(content))
							.toJSON();
					}

					default:
						return comp.component.toJSON();
				}
			}),
			accent_color: this.accentColor,
			spoiler: this.spoiler,
		});
	}

	private generateEmbed(): EmbedBuilder {
		if (!this.embedTemplate)
			throw new Error(
				"[@lilsnibbi/utils]: Pagination: embedTemplate is in a corrupted state",
			);

		const page = Math.floor(this.currentIndex / this.entriesPerPage);
		const content = this.list
			.slice(page * this.entriesPerPage, (page + 1) * this.entriesPerPage)
			.join("\n");

		return new EmbedBuilder(this.embedTemplate.toJSON())
			.setDescription(this.applyReplacements(content))
			.setFooter({ text: `Page ${page + 1}/${this.totalPages}` });
	}

	private createButton(
		idSuffix: string,
		defaultLabel: string,
		config: PaginationButtonConfig | undefined,
		disabled: boolean,
	): ButtonBuilder {
		const btn = new ButtonBuilder()
			.setCustomId(`${this.prefix}${idSuffix}`)
			.setLabel(config?.label ?? defaultLabel)
			.setStyle(config?.style ?? ButtonStyle.Secondary)
			.setDisabled(disabled);
		if (config?.emoji) btn.setEmoji(config.emoji);
		return btn;
	}

	private getPaginationRow(): ActionRowBuilder<ButtonBuilder> {
		const row = new ActionRowBuilder<ButtonBuilder>();

		if (this.showSkipButtons) {
			row.addComponents(
				this.createButton(
					"first",
					"<<",
					this.buttonOptions?.first,
					this.ended || this.currentIndex === 0,
				),
			);
		}

		row.addComponents(
			this.createButton(
				"back",
				"<",
				this.buttonOptions?.back,
				this.ended || this.currentIndex === 0,
			),
			this.createButton(
				"info",
				`${Math.floor(this.currentIndex / this.entriesPerPage) + 1}/${this.totalPages}`,
				this.buttonOptions?.jump,
				this.ended || this.totalPages === 1,
			),
			this.createButton(
				"forward",
				">",
				this.buttonOptions?.next,
				this.ended ||
					this.currentIndex + this.entriesPerPage >= this.list.length,
			),
		);

		if (this.showSkipButtons) {
			row.addComponents(
				this.createButton(
					"last",
					">>",
					this.buttonOptions?.last,
					this.ended ||
						this.currentIndex + this.entriesPerPage >= this.list.length,
				),
			);
		}

		return row;
	}

	private async handlePageJump(btn: ButtonInteraction): Promise<void> {
		const modal = new ModalBuilder()
			.setCustomId(`${this.prefix}modal`)
			.setTitle("Jump to page")
			.addLabelComponents(
				new LabelBuilder()
					.setLabel("Input a page number")
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId(`${this.prefix}number`)
							.setRequired(true)
							.setMinLength(1)
							.setStyle(TextInputStyle.Short),
					),
			);

		await btn.showModal(modal).catch((e) => console.error(e));
		const modalSubmit = await btn
			.awaitModalSubmit({
				filter: (i) => i.customId === `${this.prefix}modal`,
				time: 60_000,
			})
			.catch(() => null);

		if (!modalSubmit) return;

		const pageNumber = Number(
			modalSubmit.fields.getTextInputValue(`${this.prefix}number`),
		);

		if (
			!Number.isInteger(pageNumber) ||
			pageNumber < 1 ||
			pageNumber > this.totalPages
		) {
			await modalSubmit
				.reply({
					content: `Invalid page! Choose a number between **1** and **${this.totalPages}**.`,
					flags: ["Ephemeral"],
					allowedMentions: { parse: [], repliedUser: false },
				})
				.catch(() => null);
			return;
		}

		await modalSubmit.deferUpdate().catch(() => null);
		this.currentIndex = (pageNumber - 1) * this.entriesPerPage;
	}

	private applyReplacements(content: string): string {
		if (!this.replacements) return content;
		return Object.entries(this.replacements).reduce(
			(acc, [key, value]) => acc.replaceAll(key, value),
			content,
		);
	}

	private async render(): Promise<void> {
		try {
			const payload = this.buildPayload();

			if (this.interaction) {
				await this.interaction.editReply(payload);
			} else if (this.replyMessage) {
				await this.replyMessage.edit(payload);
			}
		} catch (error) {
			const e = error as Error;
			if (!e.message.includes("Unknown Message")) {
				console.error("Failed to render pagination:", error);
			}
		}
	}
}
