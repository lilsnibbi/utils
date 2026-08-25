# @lilsnibbi/utils

A small personal utility library for the [Bun](https://bun.sh/) runtime, with a
few extras for [discord.js](https://discord.js.org/).

The package ships raw TypeScript — there is no build step and no compiled
output. Consumers need Bun, or a bundler that resolves `.ts` imports.

```bash
bun add @lilsnibbi/utils
```

## Entry points

| Import path | Contents | Requires |
| --- | --- | --- |
| `@lilsnibbi/utils` | Helpers and the logger | — |
| `@lilsnibbi/utils/discord` | Command, event and pagination builders | `discord.js` |

`discord.js` is an optional peer dependency, so importing a helper does not pull
it in.

## Helpers

```ts
import {
  chunk,
  formatSeconds,
  isLink,
  randomInt,
  toOrdinal,
  truncate,
} from "@lilsnibbi/utils";

chunk([1, 2, 3, 4, 5], 2);                 // [[1, 2], [3, 4], [5]]
formatSeconds(9000);                       // "2 hours and 30 minutes"
formatSeconds(9000, { format: "short" });  // "2h 30m"
isLink("https://example.com");             // true
randomInt(1, 6);                           // a d6 roll
toOrdinal(22);                             // "22nd"
truncate("Hello, world!", 8);              // "Hello..."
```

`formatSeconds` is calendar-aware: years and months are measured against the
current date rather than fixed averages, so leap years and varying month
lengths are respected. It also takes `onlyUnits`, `includeZeroUnits`,
`rounding` and a `customFormatter`.

## Logger

```ts
import { Logger } from "@lilsnibbi/utils";

const logger = new Logger({ name: "api", level: "NOTIF" });

logger.notif("listening on :3000");
logger.alert("disk almost full");
logger.error(new Error("query timed out")); // prints a sanitised stack
logger.divider("STARTUP");
```

Levels are ordered `DEBUG` < `NOTIF` < `ALERT` < `ERROR`; anything below
`level` is dropped. Every method takes a trailing `raw` flag that returns the
formatted string instead of printing it:

```ts
const line = logger.alert("disk almost full", true);
```

The return type is `string | undefined` — a message filtered out by the current
level returns nothing.

## Discord

### `DiscordCommand`

Bundles a command definition with its handlers so a loader can register `data`
and dispatch `execute` without a second lookup table.

```ts
import { DiscordCommand } from "@lilsnibbi/utils/discord";

export default new DiscordCommand({
  data: new SlashCommandBuilder().setName("ping").setDescription("Pong."),
  metadata: {},
  execute: async (_client, interaction) => {
    await interaction.reply("Pong!");
  },
});
```

Give `metadata` a type across the whole project by augmenting
`DiscordCommandMetadata`:

```ts
declare module "@lilsnibbi/utils/discord" {
  interface DiscordCommandMetadata {
    cooldown?: number;
    category?: string;
  }
}
```

### `DiscordEvent`

The `type` discriminant selects which event map `name` and the handler
arguments are checked against — `"client"`, `"rest"`, or `"custom"`.

```ts
import { DiscordEvent } from "@lilsnibbi/utils/discord";

export default new DiscordEvent({
  type: "client",
  name: "messageCreate",
  method: async (_client, message) => {
    if (!message.author.bot) await message.react("👋");
  },
});
```

Custom events come from augmenting `DiscordEventCustomType`:

```ts
declare module "@lilsnibbi/utils/discord" {
  interface DiscordEventCustomType {
    myEvent: [data: string];
  }
}
```

### `DiscordPagination`

A button-driven paginator in either Components V2 container mode or classic
embed mode. The collector is scoped to the sent message and to the user who
triggered it, and each instance prefixes its button ids, so several paginators
can run in one channel without colliding.

```ts
import { DiscordPagination } from "@lilsnibbi/utils/discord";

await new DiscordPagination(entries, {
  type: "container",
  layout: [
    "# Leaderboard",
    new SeparatorBuilder(),
    DiscordPagination.DATA,
    new SeparatorBuilder(),
    DiscordPagination.BUTTONS,
  ],
  accentColor: 0x5865f2,
}).send(interaction);
```

In container mode, `layout` is a flat template rendered on every page;
`DiscordPagination.DATA` and `DiscordPagination.BUTTONS` mark where the entries
and the navigation buttons go. Bare strings become text displays.

```ts
await new DiscordPagination(entries, {
  type: "embed",
  embed: new EmbedBuilder().setTitle("Leaderboard").setColor(0x5865f2),
  showSkipButtons: true,
}).send(interaction);
```

In embed mode the embed's `description` and `footer` are overwritten each page
with the entries and the page counter.

`send` accepts a `ChatInputCommandInteraction`, a `ButtonInteraction` or a
`Message`. Shared options: `entriesPerPage` (default 5), `replacements`,
`ephemeral`, `idleTimeout` (default 60s), `buttons`, `showSkipButtons` and
`onEnd`. When the timeout elapses the buttons are disabled rather than removed.

## Development

```bash
bun test     # run the suite
bun run check   # tsc --noEmit + biome
bun run pretty  # format
```

## License

MIT
