/**
 * Root entry point for `@lilsnibbi/utils`.
 *
 * Re-exports the runtime-agnostic helpers and the logger. The discord.js
 * utilities are deliberately excluded here so that importing a helper does not
 * pull in the `discord.js` peer dependency — import them from
 * `@lilsnibbi/utils/discord` instead.
 */
export * from "./helpers";
export * from "./logger";
