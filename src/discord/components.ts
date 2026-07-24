import {
	type APIMediaGalleryItem,
	type APIButtonComponentWithCustomId,
	type APIButtonComponentWithSKUId,
	type APIButtonComponentWithURL,
	type APIMessageComponent,
	type APIMessageComponentEmoji,
	type APIModalComponent,
	type APISelectMenuDefaultValue,
	type APISelectMenuOption,
	type APIUnfurledMediaItem,
	ButtonStyle,
	type ChannelType,
	ComponentType,
	type SelectMenuDefaultValueType,
	type SeparatorSpacingSize,
	type Snowflake,
	type TextInputStyle,
} from "discord.js";

/** @deprecated Use {@link DiscordComponent}. */
export type $DiscordComponent = APIMessageComponent | APIModalComponent;
/** @deprecated Use {@link ComponentData}. */
export type $Data<T, K extends keyof T> = Partial<Pick<T, K>>;
/** @deprecated Use {@link Component}. */
export type $Component = Pick<$DiscordComponent, "type" | "id">;
/** @deprecated Use {@link PartialEmoji}. */
export type $PartialEmoji = APIMessageComponentEmoji;
/** @deprecated Use {@link SelectOption}. */
export type $SelectOption = APISelectMenuOption;
/** @deprecated Use {@link SelectDefaultValue}. */
export type $SelectDefaultValue<T extends SelectMenuDefaultValueType> =
	APISelectMenuDefaultValue<T>;
/** @deprecated Use {@link UnfurledMedia}. */
export type $UnfurledMedia = APIUnfurledMediaItem;
/** @deprecated Use {@link MediaGalleryItem}. */
export type $MediaGalleryItem = APIMediaGalleryItem;
/** @deprecated Use {@link ComponentId}. */
export type $ComponentId = { id?: number };
/** @deprecated Use {@link StandardButtonData}. */
export type $StandardButtonData = Partial<
	Omit<APIButtonComponentWithCustomId, "type" | "style">
> &
	$ComponentId & {
		style?: Exclude<ButtonStyle, ButtonStyle.Link | ButtonStyle.Premium>;
		url?: never;
		sku_id?: never;
	};
/** @deprecated Use {@link LinkButtonData}. */
export type $LinkButtonData = Omit<APIButtonComponentWithURL, "type"> &
	$ComponentId & {
		custom_id?: never;
		sku_id?: never;
	};
/** @deprecated Use {@link PremiumButtonData}. */
export type $PremiumButtonData = Omit<APIButtonComponentWithSKUId, "type"> &
	$ComponentId & {
		custom_id?: never;
		emoji?: never;
		label?: never;
		url?: never;
	};
/** @deprecated Use {@link ButtonData}. */
export type $ButtonData =
	| $StandardButtonData
	| $LinkButtonData
	| $PremiumButtonData;

/** Any message or modal component supported by Discord. */
export type DiscordComponent = $DiscordComponent;
/** Properties shared by Discord message and modal components. */
export type Component = $Component;
/** A partial selection of properties from a type. */
export type ComponentData<T, K extends keyof T> = $Data<T, K>;
/** Emoji data accepted by a message component. */
export type PartialEmoji = $PartialEmoji;
/** An option accepted by a string select component. */
export type SelectOption = $SelectOption;
/** A typed default value for an auto-populated select component. */
export type SelectDefaultValue<T extends SelectMenuDefaultValueType> =
	$SelectDefaultValue<T>;
/** Media data accepted by Discord component media fields. */
export type UnfurledMedia = $UnfurledMedia;
/** An item accepted by a media gallery component. */
export type MediaGalleryItem = $MediaGalleryItem;
/** Optional numeric identifier shared by component data objects. */
export type ComponentId = $ComponentId;
/** Constructor data for standard interactive buttons. */
export type StandardButtonData = $StandardButtonData;
/** Constructor data for link buttons. */
export type LinkButtonData = $LinkButtonData;
/** Constructor data for premium SKU buttons. */
export type PremiumButtonData = $PremiumButtonData;
/** Valid constructor data for any button style. */
export type ButtonData = $ButtonData;
/** Shared constructor data for an auto-populated select component. */
export type AutoSelectData<T extends SelectMenuDefaultValueType> =
	$AutoSelectData<T>;

/** A row containing interactive Discord components. */
export class ActionRow implements $Component {
	readonly type = ComponentType.ActionRow;
	id?: number;
	components: Component[];

	constructor(
		components: readonly Component[] = [],
		data?: ComponentData<ActionRow, "id">,
	) {
		Object.assign(this, data);
		this.components = [...components];
	}

	/** Appends components and returns this row. */
	add(...components: readonly Component[]): this {
		this.components.push(...components);
		return this;
	}
}
/** A style-aware Discord button component. */
export class Button implements $Component {
	readonly type = ComponentType.Button;
	id?: number;
	style = ButtonStyle.Secondary;
	label?: string;
	emoji?: PartialEmoji;
	custom_id?: string;
	sku_id?: Snowflake;
	url?: string;
	disabled?: boolean;

	constructor(data?: ButtonData) {
		Object.assign(this, data);
	}

	/** Creates a custom-id button. */
	static custom(
		customId: string,
		data: Omit<StandardButtonData, "custom_id"> = {},
	): Button {
		return new Button({ ...data, custom_id: customId });
	}

	/** Creates a link button. */
	static link(
		url: string,
		data: Omit<LinkButtonData, "url" | "style"> & {
			label?: string;
			emoji?: PartialEmoji;
		} = {},
	): Button {
		return new Button({ ...data, url, style: ButtonStyle.Link });
	}

	/** Creates a premium SKU button. */
	static premium(skuId: Snowflake, id?: number): Button {
		return new Button({ sku_id: skuId, style: ButtonStyle.Premium, id });
	}
}
/** A select component populated with predefined string options. */
export class StringSelect implements $Component {
	readonly type = ComponentType.StringSelect;
	id?: number;
	custom_id: string;
	options: SelectOption[];
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
	required?: boolean;

	constructor(
		custom_id: string,
		options: readonly SelectOption[],
		data?: ComponentData<
			StringSelect,
			| "placeholder"
			| "min_values"
			| "max_values"
			| "disabled"
			| "required"
			| "id"
		>,
	) {
		Object.assign(this, data);
		this.custom_id = custom_id;
		this.options = [...options];
	}

	/** Appends options and returns this select. */
	addOptions(...options: readonly SelectOption[]): this {
		this.options.push(...options);
		return this;
	}
}
/** A free-form text input used in Discord modals. */
export class TextInput implements $Component {
	readonly type = ComponentType.TextInput;
	id?: number;
	custom_id: string;
	style: TextInputStyle;
	label?: string;
	min_length?: number;
	max_length?: number;
	required?: boolean;
	value?: string;
	placeholder?: string;

	constructor(
		custom_id: string,
		style: TextInputStyle,
		data?: ComponentData<
			TextInput,
			| "min_length"
			| "max_length"
			| "required"
			| "value"
			| "placeholder"
			| "id"
			| "label"
		>,
	) {
		Object.assign(this, data);
		this.custom_id = custom_id;
		this.style = style;
	}
}
/** Base class for Discord's auto-populated select components. */
export abstract class AutoSelect<T extends SelectMenuDefaultValueType>
	implements $Component
{
	abstract readonly type: $Component["type"];
	id?: number;
	custom_id: string;
	placeholder?: string;
	default_values?: SelectDefaultValue<T>[];
	min_values?: number;
	max_values?: number;
	disabled?: boolean;

	constructor(custom_id: string, data?: AutoSelectData<T>) {
		Object.assign(this, data);
		this.custom_id = custom_id;
	}
}
/** @deprecated Use {@link AutoSelectData}. */
export type $AutoSelectData<T extends SelectMenuDefaultValueType> = $Data<
	AutoSelect<T>,
	| "placeholder"
	| "default_values"
	| "min_values"
	| "max_values"
	| "disabled"
	| "id"
>;

/** A select component populated with Discord users. */
export class UserSelect extends AutoSelect<SelectMenuDefaultValueType.User> {
	readonly type = ComponentType.UserSelect;
}
/** A select component populated with Discord roles. */
export class RoleSelect extends AutoSelect<SelectMenuDefaultValueType.Role> {
	readonly type = ComponentType.RoleSelect;
}
/** A select component populated with Discord users and roles. */
export class MentionableSelect extends AutoSelect<
	SelectMenuDefaultValueType.Role | SelectMenuDefaultValueType.User
> {
	readonly type = ComponentType.MentionableSelect;
}
/** A select component populated with Discord channels. */
export class ChannelSelect extends AutoSelect<SelectMenuDefaultValueType.Channel> {
	readonly type = ComponentType.ChannelSelect;
	channel_types?: ChannelType[];

	// The explicit constructor narrows the inherited data to channel-select fields.
	// biome-ignore lint/complexity/noUselessConstructor: preserves the public constructor type
	constructor(
		custom_id: string,
		data?: AutoSelectData<SelectMenuDefaultValueType.Channel> &
			ComponentData<ChannelSelect, "channel_types">,
	) {
		super(custom_id, data);
	}
}
/** A layout component containing text displays and an accessory. */
export class Section implements $Component {
	readonly type = ComponentType.Section;
	id?: number;
	components: Component[];
	accessory?: Thumbnail | Button;

	constructor(
		components: readonly Component[],
		data?: ComponentData<Section, "accessory" | "id">,
	) {
		Object.assign(this, data);
		this.components = [...components];
	}

	/** Appends text components and returns this section. */
	add(...components: readonly Component[]): this {
		this.components.push(...components);
		return this;
	}
}
/** A component that displays Markdown text. */
export class TextDisplay implements $Component {
	readonly type = ComponentType.TextDisplay;
	id?: number;
	content: string;

	constructor(content: string, id?: number) {
		this.content = content;
		this.id = id;
	}

	/** Appends Markdown content and returns this display. */
	append(content: string): this {
		this.content += content;
		return this;
	}
}
/** A section accessory that displays an image thumbnail. */
export class Thumbnail implements $Component {
	readonly type = ComponentType.Thumbnail;
	id?: number;
	media: UnfurledMedia;
	description?: string | null;
	spoiler?: boolean;

	constructor(
		media: UnfurledMedia,
		data?: ComponentData<Thumbnail, "description" | "spoiler" | "id">,
	) {
		Object.assign(this, data);
		this.media = media;
	}
}
/** A component that displays a collection of media items. */
export class MediaGallery implements $Component {
	readonly type = ComponentType.MediaGallery;
	id?: number;
	items: MediaGalleryItem[];

	constructor(items: readonly MediaGalleryItem[], id?: number) {
		this.items = [...items];
		this.id = id;
	}

	/** Appends media items and returns this gallery. */
	addItems(...items: readonly MediaGalleryItem[]): this {
		this.items.push(...items);
		return this;
	}
}
/** A component that displays an uploaded attachment. */
export class File implements $Component {
	readonly type = ComponentType.File;
	id?: number;
	file: UnfurledMedia;
	spoiler?: boolean;
	readonly name = "";
	readonly size = 0;

	constructor(
		file: UnfurledMedia,
		data?: ComponentData<File, "spoiler" | "id">,
	) {
		Object.assign(this, data);
		this.file = file;
	}
}
/** A layout component that adds spacing and an optional divider. */
export class Separator implements $Component {
	readonly type = ComponentType.Separator;
	id?: number;
	divider?: boolean;
	spacing?: SeparatorSpacingSize;

	constructor(data?: ComponentData<Separator, "divider" | "spacing" | "id">) {
		Object.assign(this, data);
	}
}
/** @deprecated Use {@link Separator}. */
export { Separator as Seperator };
/** A layout component that visually groups child components. */
export class Container implements $Component {
	readonly type = ComponentType.Container;
	id?: number;
	components: Component[];
	accent_color?: number | null;
	spoiler?: boolean;

	constructor(
		components: readonly Component[] = [],
		data?: ComponentData<Container, "accent_color" | "spoiler" | "id">,
	) {
		Object.assign(this, data);
		this.components = [...components];
	}

	/** Appends child components and returns this container. */
	add(...components: readonly Component[]): this {
		this.components.push(...components);
		return this;
	}
}
/** A modal layout component that labels another component. */
export class Label implements $Component {
	readonly type = ComponentType.Label;
	id?: number;
	label: string;
	description?: string;
	component: Component;

	constructor(
		label: string,
		component: Component,
		data?: ComponentData<Label, "description" | "id">,
	) {
		Object.assign(this, data);
		this.label = label;
		this.component = component;
	}
}
