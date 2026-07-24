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
	type InteractionReplyOptions,
	type MessagePayload,
	type MessageReplyOptions,
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

/** Internal marker used by {@link PaginationBuilder.BUTTONS}. */
export const BUTTONS_SYMBOL: unique symbol = Symbol("pagination-buttons");
/** Internal marker used by {@link PaginationBuilder.DATA}. */
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

/** Normalized component stored by a container-mode paginator. */
export type PaginationInternalComponent =
	| { type: "buttons" }
	| { type: "data" }
	| { type: "display"; component: TextDisplayBuilder }
	| { type: "section"; component: SectionBuilder }
	| { type: "separator"; component: SeparatorBuilder }
	| { type: "file"; component: FileBuilder }
	| { type: "gallery"; component: MediaGalleryBuilder }
	| { type: "actionrow"; component: PaginationMessageActionRow };

/** Appearance overrides for one pagination button. */
export interface PaginationButtonConfig {
	/** Button label. */
	label?: string;
	/** Discord emoji identifier or Unicode emoji. */
	emoji?: string;
	/** Discord button style. Defaults to `ButtonStyle.Secondary`. */
	style?: ButtonStyle;
}

/** Appearance overrides for pagination controls. */
export interface PaginationButtonOptions {
	/** First-page button shown when skip buttons are enabled. */
	first?: PaginationButtonConfig;
	/** Previous-page button. */
	back?: PaginationButtonConfig;
	/** Next-page button. */
	next?: PaginationButtonConfig;
	/** Last-page button shown when skip buttons are enabled. */
	last?: PaginationButtonConfig;
	/** Page indicator and jump button. */
	jump?: PaginationButtonConfig;
}

/** Shared options for all pagination modes. */
export interface PaginationBaseOptions {
	/** Number of list entries shown per page (default: 5). */
	entriesPerPage?: number;
	/** Literal key-value replacements applied to rendered page data. */
	replacements?: Readonly<Record<string, string>>;
	/** Whether the pagination message is ephemeral. */
	ephemeral?: boolean;
	/** Idle timeout in milliseconds (default: 60,000). */
	idleTimeout?: number;
	/** Custom button labels/emojis/styles. */
	buttons?: PaginationButtonOptions;
	/** Whether to show "First" and "Last" buttons. */
	showSkipButtons?: boolean;
	/** Callback invoked after the collector ends and controls are disabled. */
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

type PaginationInteraction = ButtonInteraction | ChatInputCommandInteraction;
type PaginationTarget = PaginationInteraction | Message;
type PaginationRenderer =
	| {
			type: "container";
			layout: PaginationInternalComponent[];
			accentColor?: number;
			spoiler?: boolean;
	  }
	| {
			type: "embed";
			template: EmbedBuilder;
	  };

const ALLOWED_MENTIONS = {
	parse: [] as const,
	repliedUser: false,
};
const DEFAULT_ENTRIES_PER_PAGE = 5;
const DEFAULT_IDLE_TIMEOUT = 60_000;
const PAGE_JUMP_TIMEOUT = 60_000;

function isMessageTarget(target: PaginationTarget): target is Message {
	return !("deferReply" in target);
}

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
	private readonly replacements?: Readonly<Record<string, string>>;
	private readonly ephemeral: boolean;
	private readonly prefix: string;
	private readonly totalPages: number;
	private readonly idleTimeout: number;
	private readonly buttonOptions?: PaginationButtonOptions;
	private readonly showSkipButtons: boolean;
	private readonly onEnd?: (
		interaction?: PaginationInteraction,
	) => void | Promise<void>;
	private readonly renderer: PaginationRenderer;

	// Runtime state
	private currentIndex = 0;
	private ended = false;
	private interaction?: PaginationInteraction;
	private replyMessage?: Message;

	/**
	 * Creates a paginator.
	 *
	 * @param list - Entries rendered in order, separated by newlines.
	 * @param options - Mode-specific layout and behavior options.
	 * @throws {RangeError} If `entriesPerPage` or `idleTimeout` is invalid.
	 */
	constructor(list: readonly string[], options: PaginationOptions) {
		const {
			entriesPerPage = DEFAULT_ENTRIES_PER_PAGE,
			replacements,
			ephemeral = false,
			idleTimeout = DEFAULT_IDLE_TIMEOUT,
			buttons,
			showSkipButtons = false,
			onEnd,
		} = options;

		if (!Number.isSafeInteger(entriesPerPage) || entriesPerPage <= 0) {
			throw new RangeError("entriesPerPage must be a positive integer");
		}
		if (!Number.isSafeInteger(idleTimeout) || idleTimeout <= 0) {
			throw new RangeError("idleTimeout must be a positive integer");
		}

		this.list = [...list];
		this.entriesPerPage = entriesPerPage;
		this.replacements = replacements;
		this.ephemeral = ephemeral;
		this.idleTimeout = idleTimeout;
		this.buttonOptions = buttons;
		this.showSkipButtons = showSkipButtons;
		this.onEnd = onEnd;
		this.prefix = `~PAGINATION_${crypto.randomUUID()}_`;
		this.totalPages = Math.ceil(list.length / entriesPerPage);

		if (options.type === "container") {
			this.renderer = {
				type: "container",
				layout: options.layout.map((input) => this.normalize(input)),
				accentColor: options.accentColor,
				spoiler: options.spoiler,
			};
		} else {
			this.renderer = {
				type: "embed",
				template: options.embed,
			};
		}
	}

	/**
	 * Sends the paginated message and starts the button collector.
	 * @param target - The interaction or message to reply to.
	 * @returns A promise that resolves after the initial message and collector are created.
	 */
	public async send(target: PaginationTarget): Promise<void> {
		const messageTarget = isMessageTarget(target);
		const userId = messageTarget ? target.author.id : target.user.id;

		if (!this.list.length) {
			await this.sendEmpty(target);
			return;
		}

		if (isMessageTarget(target)) {
			this.replyMessage = await target.reply(this.buildPayload());
		} else {
			await this.initializeInteraction(target);
		}

		if (!this.replyMessage) return;
		this.startCollector(userId);
	}

	private startCollector(userId: string): void {
		if (!this.replyMessage) return;
		const collector = this.replyMessage.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: this.idleTimeout,
		});

		collector.on("collect", async (btn) => {
			if (!btn.customId.startsWith(this.prefix)) return;
			if (btn.user.id !== userId) {
				return void btn.deferUpdate();
			}

			this.ended = false;
			collector.resetTimer();
			const action = btn.customId.slice(this.prefix.length);
			await this.handleNavigation(action, btn);

			if (action !== "info") {
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

	private async initializeInteraction(
		interaction: PaginationInteraction,
	): Promise<void> {
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
			this.replyMessage = await interaction.fetchReply().catch(() => undefined);
		}

		await this.render();
	}

	private async handleNavigation(
		action: string,
		button: ButtonInteraction,
	): Promise<void> {
		switch (action) {
			case "info":
				await this.handlePageJump(button);
				break;
			case "first":
				this.currentIndex = 0;
				break;
			case "last":
				this.currentIndex = this.lastPageIndex;
				break;
			case "back":
				this.moveBy(-this.entriesPerPage);
				break;
			default:
				this.moveBy(this.entriesPerPage);
		}
	}

	private moveBy(offset: number): void {
		this.currentIndex = Math.max(
			0,
			Math.min(this.currentIndex + offset, this.lastPageIndex),
		);
	}

	private async sendEmpty(target: PaginationTarget): Promise<void> {
		const isEphemeral = !isMessageTarget(target) && this.ephemeral;

		const payload =
			this.renderer.type === "container"
				? {
						components: [
							new ContainerBuilder().addTextDisplayComponents(
								new TextDisplayBuilder().setContent("No data to show"),
							),
						],
						flags: isEphemeral
							? (["Ephemeral", "IsComponentsV2"] as const)
							: (["IsComponentsV2"] as const),
						allowedMentions: ALLOWED_MENTIONS,
					}
				: {
						embeds: [
							new EmbedBuilder(this.renderer.template.toJSON()).setDescription(
								"No data to show",
							),
						],
						...(isEphemeral && { flags: ["Ephemeral"] as const }),
						allowedMentions: ALLOWED_MENTIONS,
					};

		if (isMessageTarget(target)) {
			await target
				.reply(payload as string | MessagePayload | MessageReplyOptions)
				.catch(() => {});
		} else {
			await target
				.reply(payload as string | MessagePayload | InteractionReplyOptions)
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
		if (this.renderer.type === "embed") {
			return {
				embeds: [this.generateEmbed()],
				components: [this.getPaginationRow()],
				allowedMentions: ALLOWED_MENTIONS,
			};
		}

		return {
			components: [this.generateContainer()],
			flags: ["IsComponentsV2"] as const,
			allowedMentions: ALLOWED_MENTIONS,
		};
	}

	private generateContainer(): ContainerBuilder {
		if (this.renderer.type !== "container")
			throw new Error(
				"[@lilsnibbi/utils]: Pagination: layout is in a corrupted state",
			);

		return new ContainerBuilder({
			components: this.renderer.layout.map((comp) => {
				switch (comp.type) {
					case "buttons":
						return this.getPaginationRow().toJSON();

					case "data":
						return new TextDisplayBuilder()
							.setContent(this.pageContent)
							.toJSON();

					default:
						return comp.component.toJSON();
				}
			}),
			accent_color: this.renderer.accentColor,
			spoiler: this.renderer.spoiler,
		});
	}

	private generateEmbed(): EmbedBuilder {
		if (this.renderer.type !== "embed")
			throw new Error(
				"[@lilsnibbi/utils]: Pagination: embedTemplate is in a corrupted state",
			);

		return new EmbedBuilder(this.renderer.template.toJSON())
			.setDescription(this.pageContent)
			.setFooter({ text: `Page ${this.currentPage + 1}/${this.totalPages}` });
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

	private get currentPage(): number {
		return Math.floor(this.currentIndex / this.entriesPerPage);
	}

	private get lastPageIndex(): number {
		return (this.totalPages - 1) * this.entriesPerPage;
	}

	private get pageContent(): string {
		const start = this.currentPage * this.entriesPerPage;
		const content = this.list
			.slice(start, start + this.entriesPerPage)
			.join("\n");
		return this.applyReplacements(content);
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
				`${this.currentPage + 1}/${this.totalPages}`,
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

		const modalShown = await btn
			.showModal(modal)
			.then(() => true)
			.catch(() => false);
		if (!modalShown) return;

		const modalSubmit = await btn
			.awaitModalSubmit({
				filter: (interaction) =>
					interaction.customId === `${this.prefix}modal` &&
					interaction.user.id === btn.user.id,
				time: PAGE_JUMP_TIMEOUT,
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
					allowedMentions: ALLOWED_MENTIONS,
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
