import { describe, expect, expectTypeOf, mock, test } from "bun:test";
import { Client } from "discord.js";
import { DiscordEvent, type DiscordEventEmitterLike } from "../src";

declare module "../src/discord/event" {
	interface DiscordEventCustomType {
		tick: [count: number];
	}

	interface DiscordCustomEventMap {
		tock: [label: string, enabled: boolean];
	}
}

describe("DiscordEvent", () => {
	test("stores its definition and defaults once to false", () => {
		const method = (_client: Client) => {};
		const event = new DiscordEvent({
			type: "client",
			name: "ready",
			method,
		});

		expect(event.type).toBe("client");
		expect(event.name).toBe("ready");
		expect(event.once).toBe(false);
		expect(event.method).toBe(method);
		expect(event.execute).toBe(method);
	});

	test("registers and invokes a client listener", () => {
		const client = new Client({ intents: [] });
		const method = mock((_client: Client, _readyClient: Client<true>) => {});
		const event = new DiscordEvent({
			type: "client",
			name: "ready",
			once: true,
			method,
		});

		event.register(client);
		client.emit("ready", client as Client<true>);

		expect(method).toHaveBeenCalledTimes(1);
		expect(method.mock.calls[0]?.[0]).toBe(client);
	});

	test("registers custom events with their typed arguments", () => {
		const client = new Client({ intents: [] });
		let listener: ((...args: unknown[]) => void) | undefined;
		const emitter: DiscordEventEmitterLike = {
			on: (_event, nextListener) => {
				listener = nextListener;
			},
			once: (_event, nextListener) => {
				listener = nextListener;
			},
		};
		const method = mock((_client: Client, _count: number) => {});
		const event = new DiscordEvent({
			type: "custom",
			name: "tick",
			method,
		});

		event.register(client, emitter);
		listener?.(3);

		expect(method).toHaveBeenCalledWith(client, 3);
	});

	test("infers augmented custom event arguments", () => {
		const event = new DiscordEvent({
			type: "custom",
			name: "tock",
			execute: (_client, label, enabled) => {
				expectTypeOf(label).toEqualTypeOf<string>();
				expectTypeOf(enabled).toEqualTypeOf<boolean>();
			},
		});

		expect(event).toBeInstanceOf(DiscordEvent);
		expect(event.name).toBe("tock");
	});

	test("accepts a local custom event map", () => {
		const event = new DiscordEvent<
			Client,
			"custom",
			{ pulse: [count: number] },
			"pulse"
		>({
			type: "custom",
			name: "pulse",
			execute: (_client, count) => {
				expectTypeOf(count).toEqualTypeOf<number>();
			},
		});

		expect(event.name).toBe("pulse");
	});

	test("requires an emitter for custom events", () => {
		const client = new Client({ intents: [] });
		const event = new DiscordEvent({
			type: "custom",
			name: "tick",
			method: () => {},
		});

		expect(() => event.register(client)).toThrow(
			"customEmitter is required for custom events",
		);
	});

	test("forwards synchronous and asynchronous handler errors", async () => {
		const client = new Client({ intents: [] });
		const onError = mock((_error: Error) => {});
		client.on("error", onError);

		new DiscordEvent({
			type: "client",
			name: "warn",
			method: () => {
				throw new Error("sync failure");
			},
		}).register(client);
		new DiscordEvent({
			type: "client",
			name: "warn",
			method: async () => {
				throw new Error("async failure");
			},
		}).register(client);

		client.emit("warn", "warning");
		await Promise.resolve();
		await Promise.resolve();

		expect(onError.mock.calls.map(([error]) => error.message)).toEqual([
			"sync failure",
			"async failure",
		]);
	});
});
