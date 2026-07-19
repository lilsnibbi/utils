import { describe, expect, mock, test } from "bun:test";
import {
	type ActionRowBuilder,
	type ButtonBuilder,
	type ContainerBuilder,
	EmbedBuilder,
	type Message,
} from "discord.js";
import { PaginationBuilder } from "../src";

interface EmbedPayload {
	embeds: EmbedBuilder[];
	components: ActionRowBuilder<ButtonBuilder>[];
}

function createMessageHarness() {
	let initialPayload: unknown;
	const handlers = new Map<string, (value?: unknown) => unknown>();
	const edit = mock(async (_payload: unknown) => {});
	const resetTimer = mock(() => {});
	const collector = {
		on(event: string, listener: (value?: unknown) => unknown) {
			handlers.set(event, listener);
			return collector;
		},
		resetTimer,
	};
	const replyMessage = {
		createMessageComponentCollector: () => collector,
		edit,
	};
	const reply = mock(async (payload: unknown) => {
		initialPayload = payload;
		return replyMessage;
	});
	const target = {
		author: { id: "owner" },
		reply,
	} as unknown as Message;

	return {
		target,
		handlers,
		edit,
		reply,
		resetTimer,
		getInitialPayload: () => initialPayload,
	};
}

describe("PaginationBuilder", () => {
	test("validates page size and idle timeout", () => {
		const embed = new EmbedBuilder();
		for (const entriesPerPage of [0, -1, 1.5, Number.NaN]) {
			expect(
				() =>
					new PaginationBuilder(["entry"], {
						type: "embed",
						embed,
						entriesPerPage,
					}),
			).toThrow("entriesPerPage must be a positive integer");
		}

		expect(
			() =>
				new PaginationBuilder(["entry"], {
					type: "embed",
					embed,
					idleTimeout: 0,
				}),
		).toThrow("idleTimeout must be a positive integer");
	});

	test("renders an embed page and advances with its forward button", async () => {
		const harness = createMessageHarness();
		const pagination = new PaginationBuilder(["one", "two", "three"], {
			type: "embed",
			embed: new EmbedBuilder().setTitle("Items"),
			entriesPerPage: 2,
		});

		await pagination.send(harness.target);

		const initial = harness.getInitialPayload() as EmbedPayload;
		expect(initial.embeds[0]?.toJSON()).toMatchObject({
			title: "Items",
			description: "one\ntwo",
			footer: { text: "Page 1/2" },
		});

		const forwardButton = initial.components[0]
			?.toJSON()
			.components.find(
				(component) =>
					"custom_id" in component && component.custom_id.endsWith("forward"),
			);
		const forwardId =
			forwardButton && "custom_id" in forwardButton
				? forwardButton.custom_id
				: undefined;
		expect(forwardId).toBeDefined();

		const deferUpdate = mock(async () => {});
		await harness.handlers.get("collect")?.({
			user: { id: "owner" },
			customId: forwardId ?? "",
			deferUpdate,
		});

		expect(deferUpdate).toHaveBeenCalledTimes(1);
		expect(harness.resetTimer).toHaveBeenCalledTimes(1);
		const updated = harness.edit.mock.calls.at(-1)?.[0] as EmbedPayload;
		expect(updated.embeds[0]?.toJSON()).toMatchObject({
			description: "three",
			footer: { text: "Page 2/2" },
		});
	});

	test("renders container layouts and literal replacements", async () => {
		const harness = createMessageHarness();
		const pagination = new PaginationBuilder(["{position}. Ada"], {
			type: "container",
			layout: ["# Results", PaginationBuilder.DATA, PaginationBuilder.BUTTONS],
			replacements: { "{position}": "1" },
			accentColor: 0x58_65_f2,
		});

		await pagination.send(harness.target);

		const payload = harness.getInitialPayload() as {
			components: ContainerBuilder[];
		};
		const container = payload.components[0]?.toJSON();
		expect(container?.accent_color).toBe(0x58_65_f2);
		expect(JSON.stringify(container)).toContain("1. Ada");
	});

	test("sends an empty-state response without creating a collector", async () => {
		const harness = createMessageHarness();
		const pagination = new PaginationBuilder([], {
			type: "embed",
			embed: new EmbedBuilder().setTitle("Items"),
		});

		await pagination.send(harness.target);

		expect(harness.reply).toHaveBeenCalledTimes(1);
		const payload = harness.getInitialPayload() as { embeds: EmbedBuilder[] };
		expect(payload.embeds[0]?.toJSON().description).toBe("No data to show");
		expect(harness.handlers.size).toBe(0);
	});

	test("ignores unrelated buttons before checking their user", async () => {
		const harness = createMessageHarness();
		const pagination = new PaginationBuilder(["one"], {
			type: "embed",
			embed: new EmbedBuilder(),
		});
		await pagination.send(harness.target);

		const deferUpdate = mock(async () => {});
		await harness.handlers.get("collect")?.({
			user: { id: "someone-else" },
			customId: "unrelated-button",
			deferUpdate,
		});

		expect(deferUpdate).not.toHaveBeenCalled();
	});
});
