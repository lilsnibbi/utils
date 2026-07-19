# @lilsnibbi/utils

Source-first TypeScript utilities for [Bun](https://bun.sh/) and
[discord.js](https://discord.js.org/). The package intentionally ships its
TypeScript source instead of compiled JavaScript.

## Install

```bash
bun add @lilsnibbi/utils discord.js
```

## Usage

Import everything from the package root:

```ts
import { chunk, createLogger, defineCommand } from "@lilsnibbi/utils";
```

Or use a focused public entry point:

```ts
import { defineCommand, PaginationBuilder } from "@lilsnibbi/utils/discord";
import { AppError } from "@lilsnibbi/utils/error";
import { chunk, formatSeconds, isLink, randomInt, toOrdinal, truncate } from "@lilsnibbi/utils/helpers";
import { createLogger } from "@lilsnibbi/utils/logger";
```

## Development

```bash
bun install
bun run check
```

Tests live in `tests/`. Run `bun run test:coverage` for a coverage report or
`bun run bench` for the URL validation benchmark.

## License

[MIT](LICENSE)
