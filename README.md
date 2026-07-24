# @lilsnibbi/utils

Source-first TypeScript utilities for Bun and discord.js. The package ships its
TypeScript directly, so consumers get the original types and documentation.

## Install

```bash
bun add @lilsnibbi/utils discord.js
```

`discord.js` is a peer dependency. Projects using only the general helpers can
import from `@lilsnibbi/utils/helpers` without using the Discord modules.

## Entry points

```ts
import { retry, truncate } from "@lilsnibbi/utils/helpers";
import { AppError } from "@lilsnibbi/utils/error";
import { createLogger } from "@lilsnibbi/utils/logger";

import { DiscordCommand } from "@lilsnibbi/utils/discord/command";
import { Button, Container } from "@lilsnibbi/utils/discord/components";
import { DiscordEvent } from "@lilsnibbi/utils/discord/event";
import { PaginationBuilder } from "@lilsnibbi/utils/discord/pagination";
```

The package root and `@lilsnibbi/utils/discord` remain convenient barrels. The
narrow Discord paths keep component-heavy autocomplete out of command and event
files.

## Discord commands and events

Both APIs use classes directly—there are no wrapper factories.

```ts
import { SlashCommandBuilder } from "discord.js";
import {
  DiscordCommand,
  DiscordEvent,
} from "@lilsnibbi/utils/discord";

const ping = new DiscordCommand({
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot"),
  execute: async (_client, interaction) => {
    await interaction.reply("Pong!");
  },
  metadata: { cooldown: 5 },
});

const ready = new DiscordEvent({
  type: "client",
  name: "ready",
  once: true,
  execute: (_client, readyClient) => {
    console.log(`Ready as ${readyClient.user.tag}`);
  },
});
```

Command interactions narrow from their command data. Custom event argument
tuples can be registered through `DiscordCustomEventMap` module augmentation.

## Components

Components are lightweight API-shaped objects with fluent composition helpers.

```ts
import {
  ActionRow,
  Button,
  Container,
  TextDisplay,
} from "@lilsnibbi/utils/discord/components";

const controls = new ActionRow().add(
  Button.custom("confirm", { label: "Confirm" }),
  Button.link("https://example.com", { label: "Help" }),
);

const layout = new Container()
  .add(new TextDisplay("## Confirm this action"), controls);
```

## Helpers

```ts
import {
  chunk,
  formatSeconds,
  isLink,
  parseLink,
  randomItem,
  retry,
  shuffle,
  sleep,
  truncate,
} from "@lilsnibbi/utils/helpers";

chunk(new Set([1, 2, 3, 4]), 2); // [[1, 2], [3, 4]]
formatSeconds(3661, { maxUnits: 2 }); // "1 hour and 1 minute"
truncate("A fairly long sentence", 12, {
  ellipsis: "…",
  preserveWords: true,
});

const url = parseLink("https://example.com/docs", {
  hosts: ["example.com"],
  allowCredentials: false,
});
isLink("https://example.com");

randomItem(["red", "green", "blue"]);
shuffle([1, 2, 3]);

await retry(() => fetch("https://example.com"), {
  attempts: 3,
  delay: 250,
  backoff: 2,
});
await sleep(100);
```

## Typed errors

Register error codes and their structured details through module augmentation:

```ts
declare module "@lilsnibbi/utils/error" {
  interface AppErrorCodes {
    UserNotFound: { userId: string };
  }
}

const error = new AppError("User does not exist", "UserNotFound", {
  details: { userId: "123" },
  tags: ["users"],
  omitStack: false,
});

error.toJSON();
```

Use `isAppError(value, "UserNotFound")` to narrow caught values.

## Logger

```ts
const logger = createLogger({ name: "api", level: "NOTIF" });
logger.notif("Listening");
logger.error(new Error("Database unavailable"));

const worker = logger.child("worker");
worker.log("ALERT", "Retrying job");
```

Pass `output` to receive structured `LogEntry` objects instead of writing to the
console. `format()` and the existing `raw: true` log overloads format without
writing.

## Development

```bash
bun install
bun run check
bun run test:coverage
```

Tests live in `tests/`. Publishing runs the complete quality gate automatically.

## License

[MIT](LICENSE)
