/** biome-ignore-all lint/suspicious/noExplicitAny: Its fine */
import type { Client, ClientEvents, RestEvents } from "discord.js";

// biome-ignore lint/suspicious/noEmptyInterface: Extended by consumers
export interface DiscordEventCustomType {}

export type EventMap<T extends "client" | "rest" | "custom"> =
	T extends "client"
		? ClientEvents
		: T extends "rest"
			? RestEvents
			: keyof DiscordEventCustomType extends never
				? { "no events made": [] }
				: DiscordEventCustomType;

export type EventArgs<
	T extends "client" | "rest" | "custom",
	K extends keyof EventMap<T>,
> = Extract<EventMap<T>[K], any[]>;

/**
 * Wraps a discord.js event handler. Supports `"client"`, `"rest"`, and `"custom"` event types.
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

	/**
	 * Registers the event listener to the client or custom emitter.
	 * Asynchronous listener errors are caught and emitted via client's "error" event.
	 */
	public register(
		client: C,
		customEmitter?: {
			on: (event: string, listener: (...args: any[]) => void) => any;
			once: (event: string, listener: (...args: any[]) => void) => any;
		},
	): void {
		const listener = (...args: any[]) => {
			const result = this.method(client, ...(args as EventArgs<T, K>));
			if (result instanceof Promise) {
				result.catch((error) => {
					client.emit("error", error);
				});
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
		} else if (this.type === "custom" && customEmitter) {
			if (this.once) {
				customEmitter.once(this.name as string, listener);
			} else {
				customEmitter.on(this.name as string, listener);
			}
		}
	}
}
