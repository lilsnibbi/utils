import type { Client, ClientEvents, RestEvents } from "discord.js";

/** Consumer-augmentable map of custom event names to argument tuples. */
// biome-ignore lint/suspicious/noEmptyInterface: Intentionally extended by consumers.
export interface DiscordEventCustomType {}

/** Maps an event source to the events exposed by that source. */
export type EventMap<T extends "client" | "rest" | "custom"> =
	T extends "client"
		? ClientEvents
		: T extends "rest"
			? RestEvents
			: keyof DiscordEventCustomType extends never
				? { "no events made": [] }
				: DiscordEventCustomType;

/** Argument tuple for an event name and source. */
export type EventArgs<
	T extends "client" | "rest" | "custom",
	K extends keyof EventMap<T>,
> = Extract<EventMap<T>[K], unknown[]>;

/** Minimal event-emitter interface used for custom events. */
export interface EventEmitterLike {
	on(event: string, listener: (...args: unknown[]) => void): unknown;
	once(event: string, listener: (...args: unknown[]) => void): unknown;
}

/** Options for constructing a {@link DiscordEvent}. */
export interface DiscordEventOptions<
	C extends Client,
	T extends "client" | "rest" | "custom",
	K extends keyof EventMap<T>,
> {
	/** Event source. */
	type: T;
	/** Event name exposed by the selected source. */
	name: K;
	/** Registers a one-time listener when `true`. Defaults to `false`. */
	once?: boolean;
	/** Event handler. */
	method: (client: C, ...args: EventArgs<T, K>) => void | Promise<void>;
}

/**
 * Wraps a typed discord.js client, REST, or custom event handler.
 */
export class DiscordEvent<
	C extends Client = Client,
	T extends "client" | "rest" | "custom" = "client" | "rest" | "custom",
	K extends keyof EventMap<T> = keyof EventMap<T>,
> {
	public readonly type: T;
	public readonly name: K;
	public readonly once: boolean;
	public readonly method: (
		client: C,
		...args: EventArgs<T, K>
	) => void | Promise<void>;

	/** Creates a typed event definition. */
	constructor(options: DiscordEventOptions<C, T, K>) {
		this.type = options.type;
		this.name = options.name;
		this.once = options.once ?? false;
		this.method = options.method;
	}

	/**
	 * Registers the event listener with its configured source.
	 *
	 * Synchronous and asynchronous handler failures are forwarded to the client's
	 * `error` event.
	 *
	 * @param client - The client passed to the handler and used for client/REST events.
	 * @param customEmitter - Required when the event source is `"custom"`.
	 * @throws {Error} If a custom event is registered without an emitter.
	 */
	public register(client: C, customEmitter?: EventEmitterLike): void {
		const emitError = (cause: unknown): void => {
			const error =
				cause instanceof Error
					? cause
					: new Error("Discord event handler failed", { cause });
			client.emit("error", error);
		};
		const listener = (...args: unknown[]): void => {
			try {
				void Promise.resolve(
					this.method(client, ...(args as EventArgs<T, K>)),
				).catch(emitError);
			} catch (error) {
				emitError(error);
			}
		};

		if (this.type === "client") {
			if (this.once) {
				client.once(this.name as string, listener);
			} else {
				client.on(this.name as string, listener);
			}
		} else if (this.type === "rest") {
			if (this.once) {
				client.rest.once(this.name as string, listener);
			} else {
				client.rest.on(this.name as string, listener);
			}
		} else {
			if (!customEmitter) {
				throw new Error("customEmitter is required for custom events");
			}
			if (this.once) {
				customEmitter.once(this.name as string, listener);
			} else {
				customEmitter.on(this.name as string, listener);
			}
		}
	}
}
