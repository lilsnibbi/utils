import { describe, expect, test, mock } from "bun:test";
import { Client } from "discord.js";
import { DiscordEvent } from "../src";

describe("DiscordEvent", () => {
	test("should instantiate an event with type, name, once and method", () => {
		const method = (_client: Client) => {};
		const event = new DiscordEvent({
			type: "client",
			name: "ready",
			once: true,
			method
		});

		expect(event.type).toBe("client");
		expect(event.name).toBe("ready");
		expect(event.once).toBe(true);
		expect(event.method).toBe(method);
	});

	test("should register to client emitter", () => {
		const client = new Client({ intents: [] });
		const onSpy = mock((_event: string, _listener: (...args: any[]) => void) => {});
		client.on = onSpy as any;

		const method = (_c: Client) => {};
		const event = new DiscordEvent({
			type: "client",
			name: "ready",
			once: false,
			method
		});

		event.register(client);
		expect(onSpy).toHaveBeenCalled();
		expect(onSpy.mock.calls[0]?.[0]).toBe("ready");
	});
});
