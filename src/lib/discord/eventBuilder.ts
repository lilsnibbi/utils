/** biome-ignore-all lint/suspicious/noExplicitAny: Its fine */
import type { Client, ClientEvents, RestEvents } from "discord.js";

/**
 * Augment this interface via module declaration to register custom event types.
 * @example
 * declare module "@lilsnibbi/utils/discord" {
 *   interface DiscordEventCustomType {
 *     myEvent: [data: string];
 *   }
 * }
 */
// biome-ignore lint/suspicious/noEmptyInterface: It's fine
export interface DiscordEventCustomType {}

/** Maps an event type discriminant to its corresponding event map. */
export type EventMap<T extends "client" | "rest" | "custom"> =
	T extends "client"
		? ClientEvents
		: T extends "rest"
			? RestEvents
			: keyof DiscordEventCustomType extends never
				? { "no events made": [] }
				: DiscordEventCustomType;

/** Resolves the argument tuple for a given event type + key pair. */
export type EventArgs<
	T extends "client" | "rest" | "custom",
	K extends keyof EventMap<T>,
> = Extract<EventMap<T>[K], any[]>;

/**
 * Wraps a discord.js event handler. Supports `"client"`, `"rest"`, and `"custom"` event types.
 */
export class EventBuilder<
	T extends "client" | "rest" | "custom",
	K extends keyof EventMap<T> = keyof EventMap<T>,
	C extends Client = Client,
> {
	public readonly type: T;
	public readonly name: K;
	public readonly once: boolean;
	public readonly method: (
		client: C,
		...args: EventArgs<T, K>
	) => void | Promise<void>;

	constructor(opts: {
		type: T;
		name: K;
		once: boolean;
		method: (client: C, ...args: EventArgs<T, K>) => void | Promise<void>;
	}) {
		this.type = opts.type;
		this.name = opts.name;
		this.once = opts.once;
		this.method = opts.method;
	}
}
