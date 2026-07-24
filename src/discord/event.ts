import type { Client, ClientEvents, RestEvents } from "discord.js";

/** Sources supported by a Discord event definition. */
export type DiscordEventSource = "client" | "rest" | "custom";

/** Consumer-augmentable map of custom event names to argument tuples. */
// biome-ignore lint/suspicious/noEmptyInterface: Intentionally extended by consumers.
export interface DiscordCustomEventMap {}

/** @deprecated Augment {@link DiscordCustomEventMap} instead. */
// biome-ignore lint/suspicious/noEmptyInterface: Kept for backwards-compatible module augmentation.
export interface DiscordEventCustomType {}

type CustomEventMap = DiscordCustomEventMap & DiscordEventCustomType;
type EventTupleMap<T> = { [K in keyof T]: readonly unknown[] };

/** Maps an event source to the events exposed by that source. */
export type DiscordEventMap<
	S extends DiscordEventSource,
	CustomEvents extends EventTupleMap<CustomEvents> = CustomEventMap,
> = S extends "client"
	? ClientEvents
	: S extends "rest"
		? RestEvents
		: CustomEvents;

/** Argument tuple for an event name and source. */
export type DiscordEventArgs<
	S extends DiscordEventSource,
	K extends keyof DiscordEventMap<S, CustomEvents>,
	CustomEvents extends EventTupleMap<CustomEvents> = CustomEventMap,
> = Extract<DiscordEventMap<S, CustomEvents>[K], readonly unknown[]>;

/** @deprecated Use {@link DiscordEventMap}. */
export type EventMap<S extends DiscordEventSource> = DiscordEventMap<S>;

/** @deprecated Use {@link DiscordEventArgs}. */
export type EventArgs<
	S extends DiscordEventSource,
	K extends keyof DiscordEventMap<S>,
> = DiscordEventArgs<S, K>;

/** Minimal event-emitter interface used for custom events. */
export interface DiscordEventEmitterLike {
	on(event: string, listener: (...args: unknown[]) => void): unknown;
	once(event: string, listener: (...args: unknown[]) => void): unknown;
}

/** @deprecated Use {@link DiscordEventEmitterLike}. */
export type EventEmitterLike = DiscordEventEmitterLike;

/** Handler for a typed Discord event. */
export type DiscordEventHandler<
	C extends Client,
	S extends DiscordEventSource,
	K extends keyof DiscordEventMap<S, CustomEvents>,
	CustomEvents extends EventTupleMap<CustomEvents> = CustomEventMap,
> = (
	client: C,
	...args: DiscordEventArgs<S, K, CustomEvents>
) => void | Promise<void>;

/** Options for constructing a {@link DiscordEvent}. */
export type DiscordEventOptions<
	C extends Client,
	S extends DiscordEventSource,
	K extends keyof DiscordEventMap<S, CustomEvents>,
	CustomEvents extends EventTupleMap<CustomEvents> = CustomEventMap,
> = {
	/** Event source. */
	type: S;
	/** Event name exposed by the selected source. */
	name: K;
	/** Registers a one-time listener when `true`. Defaults to `false`. */
	once?: boolean;
} & (
	| {
			/** Event handler. */
			execute: DiscordEventHandler<C, S, K, CustomEvents>;
			method?: never;
	  }
	| {
			/** @deprecated Use `execute`. */
			method: DiscordEventHandler<C, S, K, CustomEvents>;
			execute?: never;
	  }
);

/**
 * Wraps a typed discord.js client, REST, or custom event handler.
 */
export class DiscordEvent<
	C extends Client = Client,
	S extends DiscordEventSource = DiscordEventSource,
	CustomEvents extends EventTupleMap<CustomEvents> = CustomEventMap,
	K extends keyof DiscordEventMap<S, CustomEvents> = keyof DiscordEventMap<
		S,
		CustomEvents
	>,
> {
	public readonly type: S;
	public readonly name: K;
	public readonly once: boolean;
	public readonly execute: DiscordEventHandler<C, S, K, CustomEvents>;
	/** @deprecated Use {@link execute}. */
	public readonly method: DiscordEventHandler<C, S, K, CustomEvents>;

	/** Creates a typed event definition. */
	constructor(options: DiscordEventOptions<C, S, K, CustomEvents>) {
		this.type = options.type;
		this.name = options.name;
		this.once = options.once ?? false;
		this.execute = options.execute ?? options.method;
		this.method = this.execute;
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
	public register(client: C, customEmitter?: DiscordEventEmitterLike): void {
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
					this.execute(
						client,
						...(args as unknown as DiscordEventArgs<S, K, CustomEvents>),
					),
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
