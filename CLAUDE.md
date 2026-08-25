# @lilsnibbi/utils — CLAUDE.md

## Project Overview

A personal TypeScript utility library published to npm as `@lilsnibbi/utils`.
Designed exclusively for the **Bun runtime**. Ships raw TypeScript source — no
build step, no compiled output.

- **Package**: `@lilsnibbi/utils` (public, MIT)
- **Runtime**: Bun
- **Language**: TypeScript (strict, ESNext, bundler module resolution)
- **Linter/Formatter**: Biome
- **Package manager**: `bun`

## Branch Strategy

- `main` — stable/published branch
- `dev` — active development branch (Renovate targets this)
- PRs merge `dev` → `main` before publishing

## Key Scripts

```bash
bun test          # run all tests
bun run check     # tsc --noEmit + biome check
bun run pretty    # format with Biome
bun run pub       # publish to npm (bun publish --access public)
```

`bun run check` must pass before committing. There is no CI workflow — the
checks are local only.

## Project Structure

```
src/
  index.ts                  # root barrel — helpers + logger only
  discord/
    index.ts                # barrel for @lilsnibbi/utils/discord
    types.ts                # shared discord.js type aliases
    DiscordCommand.ts
    DiscordEvent.ts
    DiscordPagination.ts
  helpers/
    index.ts                # re-exported from the package root
    chunk.ts
    formatSeconds.ts
    isLink.ts
    randomInt.ts
    toOrdinal.ts
    truncate.ts
  logger/
    index.ts                # re-exported from the package root
    Logger.ts
tests/                      # mirrors src/
  discord/builders.test.ts
  helpers/*.test.ts
  logger/Logger.test.ts
```

Conventions:

- One export per file; the filename matches the thing it exports.
- Files exporting a class are `PascalCase`; files exporting a function are
  `camelCase`.
- Shared type aliases for a folder live in that folder's `types.ts`, so
  individual modules import from `./types` rather than repeating long
  `discord.js` import lists.
- Every exported symbol carries JSDoc. Option bags are named, exported
  interfaces — never inline object types — so consumers can name them.

## Source Modules

### Helpers — `@lilsnibbi/utils`

| Export | Summary |
| --- | --- |
| `chunk(array, size)` | Splits an array into chunks of at most `size`. Throws `RangeError` unless `size` is a positive integer. |
| `formatSeconds(seconds, options?)` | Calendar-aware duration formatter. See `FormatSecondsOptions`. |
| `isLink(value)` | Whether a string parses as an absolute URL (any scheme). |
| `randomInt(min, max)` | Uniform integer in `[min, max]`. Not cryptographically secure. |
| `toOrdinal(value)` | English ordinal via `Intl.PluralRules`. |
| `truncate(value, maxLength)` | Shortens to `maxLength`, ellipsis included in the budget. |

`formatSeconds` measures years and months against the current date rather than
fixed averages, so leap years and varying month lengths are respected. Exported
types: `FormatSecondsOptions`, `TimeUnit`, `RoundingMode`, `DurationFormat`.

### `Logger` — `@lilsnibbi/utils`

Chalk-based structured logger. Levels are ordered `DEBUG` < `NOTIF` < `ALERT` <
`ERROR`; anything below the configured `level` is dropped.

- `log(level, message, raw?)` plus `debug` / `notif` / `alert` / `error`
  shorthands.
- The `raw` flag returns the formatted string instead of printing. Its return
  type is `string | undefined` — a message dropped by the level filter returns
  nothing.
- Passing an `Error` prints a sanitised stack: paths normalised, frames
  rewritten into a compact tree.
- `divider(text)` prints a centred `─` rule.
- Timestamp format: `[Day HH:mm:ss.SSS]`, 24h, locale configurable.

### Discord — `@lilsnibbi/utils/discord`

Requires the `discord.js` optional peer dependency. Deliberately **not**
re-exported from the package root, so importing a helper does not pull it in.

**`DiscordCommand<C extends Client>`** — a slash or context menu command with
its `execute` and optional `autocomplete` handlers. Augment
`DiscordCommandMetadata` to type the `metadata` bag project-wide.

**`DiscordEvent<T, K, C>`** — an event listener plus its registration metadata.
The `type` discriminant (`"client"` | `"rest"` | `"custom"`) selects the event
map that `name` and the handler arguments are checked against. Custom events
come from augmenting `DiscordEventCustomType`.

**`DiscordPagination`** — button-driven paginator with two modes, discriminated
by `type`:

- `"container"` — Components V2. `layout` is a flat template using the
  `DiscordPagination.DATA` and `DiscordPagination.BUTTONS` sentinels; bare
  strings become text displays. Adds `accentColor` and `spoiler`.
- `"embed"` — classic `EmbedBuilder`. Its `description` and `footer` are
  overwritten each page with the entries and the page counter.

Construct with `new DiscordPagination(list, options)`, then `.send(target)`
where `target` is a `ChatInputCommandInteraction`, `ButtonInteraction` or
`Message`. Shared options: `entriesPerPage` (default 5), `replacements`,
`ephemeral`, `idleTimeout` (default 60s), `buttons`, `showSkipButtons`,
`onEnd`. Button ids are prefixed with a per-instance `randomUUIDv7()`, and the
collector is scoped to the sent message and its triggering user. On timeout the
buttons are disabled rather than removed.

## Code Style

Enforced by Biome — run `bun run pretty` before committing:

- **Indent**: tabs
- **Quotes**: double quotes for JS/TS strings
- **Line endings**: LF (`.gitattributes` enforces this on checkout)
- **Linter**: Biome recommended rules
- Import organization: disabled (`organizeImports` is off)

Guard clauses throw `RangeError` for out-of-range arguments, not bare `Error`.

## Testing

Tests use `bun:test` (built-in) and mirror the `src/` layout under `tests/`.

- No mocking of external services — `Logger` tests spy on `console.*`.
- Discord coverage is limited to construction and validation; anything needing
  a gateway connection is out of scope.

## Publishing

```bash
bun run pub   # publishes src/ as-is
```

Entry point and types both point at `./src/index.ts`.

### Subpath Exports

`exports` declares `"."` for the root barrel and a `"./*"` wildcard mapping
each folder under `src/` to its `index.ts`:

```ts
import { formatSeconds, Logger } from "@lilsnibbi/utils";
import { DiscordCommand } from "@lilsnibbi/utils/discord";
```

To add a subpath, create a folder under `src/` with an `index.ts` barrel. No
`package.json` change is needed.

## Renovate

Auto-dependency updates are configured in `renovate.json`, targeting the `dev`
branch. All update types are scheduled "at any time". PRs are
assigned/reviewed by `lilsnibbi`.
