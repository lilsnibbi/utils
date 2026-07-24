import { describe, expect, test } from "bun:test";
import { ButtonStyle, ComponentType } from "discord.js";
import {
	ActionRow,
	Button,
	Container,
	StringSelect,
	TextDisplay,
} from "@lilsnibbi/utils/discord/components";

describe("Discord components", () => {
	test("creates buttons with convenient factories", () => {
		expect(Button.custom("confirm", { label: "Confirm" })).toMatchObject({
			type: ComponentType.Button,
			custom_id: "confirm",
			label: "Confirm",
			style: ButtonStyle.Secondary,
		});
		expect(Button.link("https://example.com", { label: "Open" })).toMatchObject(
			{
				url: "https://example.com",
				label: "Open",
				style: ButtonStyle.Link,
			},
		);
		expect(Button.premium("123")).toMatchObject({
			sku_id: "123",
			style: ButtonStyle.Premium,
		});
	});

	test("supports fluent component composition without mutating inputs", () => {
		const source: TextDisplay[] = [];
		const container = new Container(source).add(
			new TextDisplay("Hello").append(" world"),
		);
		const row = new ActionRow().add(Button.custom("next"));
		const select = new StringSelect("choice", []).addOptions({
			label: "One",
			value: "one",
		});

		expect(source).toEqual([]);
		expect(container.components[0]).toMatchObject({ content: "Hello world" });
		expect(row.components).toHaveLength(1);
		expect(select.options).toHaveLength(1);
	});
});
