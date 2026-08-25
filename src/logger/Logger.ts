import { inspect } from "node:util";
import chalk from "chalk";

const { bold, cyan, dim, gray, magenta, red, yellow } = chalk;

/** Severity levels emitted by {@link Logger}, ordered from least to most severe. */
export type LogLevel = "DEBUG" | "NOTIF" | "ALERT" | "ERROR";

/** Options accepted by the {@link Logger} constructor. */
export interface LoggerOptions {
	/** Label printed between the timestamp and the level, e.g. the service name. */
	name: string;
	/** Locale used to render timestamps. Defaults to `"en-US"`. */
	timeformat?: Intl.LocalesArgument;
	/** Whether to prefix each line with a timestamp. Defaults to `true`. */
	includeTimestamps?: boolean;
	/** Total character width of {@link Logger.divider} output. Defaults to `50`. */
	dividerWidth?: number;
	/**
	 * Minimum level to emit; anything below it is dropped. Ordered
	 * `DEBUG` < `NOTIF` < `ALERT` < `ERROR`. Defaults to `"DEBUG"`.
	 */
	level?: LogLevel;
}

/** Relative severity of each level, used to decide what gets dropped. */
const LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
	DEBUG: 0,
	NOTIF: 1,
	ALERT: 2,
	ERROR: 3,
};

/** Chalk style applied to each level label. */
const LEVEL_COLORS: Readonly<Record<LogLevel, typeof chalk>> = {
	DEBUG: magenta,
	NOTIF: cyan,
	ALERT: yellow,
	ERROR: red,
};

/** `console` method each level is routed to. */
const LEVEL_CONSOLE_METHODS: Readonly<
	Record<LogLevel, "debug" | "log" | "warn" | "error">
> = {
	DEBUG: "debug",
	NOTIF: "log",
	ALERT: "warn",
	ERROR: "error",
};

/**
 * Structured console logger with timestamped, colour-coded output.
 *
 * Every logging method takes a trailing `raw` flag: when `true` the formatted
 * string is returned instead of printed, so the output can be reused elsewhere
 * (a Discord message, a test assertion) without duplicating the format logic.
 *
 * @example
 * ```ts
 * const logger = new Logger({ name: "api", level: "NOTIF" });
 *
 * logger.notif("listening on :3000");
 * logger.error(new Error("query timed out"));
 *
 * const line = logger.alert("disk almost full", true); // returned, not printed
 * ```
 */
export class Logger {
	/** Label printed between the timestamp and the level. */
	public name: string;
	/** Minimum level currently emitted. */
	public level: LogLevel;

	private readonly formatter: Intl.DateTimeFormat;
	private readonly includeTimestamps: boolean;
	private readonly dividerWidth: number;

	constructor(options: LoggerOptions) {
		this.name = options.name;
		this.level = options.level ?? "DEBUG";
		this.includeTimestamps = options.includeTimestamps ?? true;
		this.dividerWidth = options.dividerWidth ?? 50;
		this.formatter = new Intl.DateTimeFormat(options.timeformat ?? "en-US", {
			weekday: "short",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}

	/**
	 * Sets the minimum level to emit.
	 * @param level - The new minimum level.
	 * @returns This logger, for chaining.
	 */
	public setLevel(level: LogLevel): this {
		this.level = level;
		return this;
	}

	/**
	 * Logs a message at an explicit level.
	 * @param level - The severity to log at.
	 * @param message - The value to log. An `Error` keeps its sanitised stack.
	 * @param raw - Return the formatted string instead of printing it.
	 * @returns The formatted string when `raw` is `true`, or `undefined` if the
	 * message was dropped by the current {@link Logger.level}.
	 */
	public log(level: LogLevel, message: unknown, raw: true): string | undefined;
	public log(level: LogLevel, message: unknown, raw?: false): void;
	public log(
		level: LogLevel,
		message: unknown,
		raw?: boolean,
	): string | undefined;
	public log(
		level: LogLevel,
		message: unknown,
		raw = false,
	): string | undefined {
		if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.level]) return;

		const formatted = this.format(level, message);

		if (raw) {
			return formatted instanceof Error
				? (formatted.stack ?? formatted.message)
				: formatted;
		}

		console[LEVEL_CONSOLE_METHODS[level]](formatted);
	}

	/**
	 * Logs at `DEBUG` — verbose tracing, usually filtered out in production.
	 * @param message - The value to log.
	 * @param raw - Return the formatted string instead of printing it.
	 * @returns The formatted string when `raw` is `true`, or `undefined` if the
	 * message was dropped by the current {@link Logger.level}.
	 */
	public debug(message: unknown, raw: true): string | undefined;
	public debug(message: unknown, raw?: false): void;
	public debug(message: unknown, raw = false): string | undefined {
		return this.log("DEBUG", message, raw);
	}

	/**
	 * Logs at `NOTIF` — ordinary informational output.
	 * @param message - The value to log.
	 * @param raw - Return the formatted string instead of printing it.
	 * @returns The formatted string when `raw` is `true`, or `undefined` if the
	 * message was dropped by the current {@link Logger.level}.
	 */
	public notif(message: unknown, raw: true): string | undefined;
	public notif(message: unknown, raw?: false): void;
	public notif(message: unknown, raw = false): string | undefined {
		return this.log("NOTIF", message, raw);
	}

	/**
	 * Logs at `ALERT` — something unexpected that is not yet a failure.
	 * @param message - The value to log.
	 * @param raw - Return the formatted string instead of printing it.
	 * @returns The formatted string when `raw` is `true`, or `undefined` if the
	 * message was dropped by the current {@link Logger.level}.
	 */
	public alert(message: unknown, raw: true): string | undefined;
	public alert(message: unknown, raw?: false): void;
	public alert(message: unknown, raw = false): string | undefined {
		return this.log("ALERT", message, raw);
	}

	/**
	 * Logs at `ERROR` — a failure. Passing an `Error` prints its sanitised stack.
	 * @param message - The value to log.
	 * @param raw - Return the formatted string instead of printing it.
	 * @returns The formatted string when `raw` is `true`, or `undefined` if the
	 * message was dropped by the current {@link Logger.level}.
	 */
	public error(message: unknown, raw: true): string | undefined;
	public error(message: unknown, raw?: false): void;
	public error(message: unknown, raw = false): string | undefined {
		return this.log("ERROR", message, raw);
	}

	/**
	 * Prints a horizontal rule with the given text centred inside it.
	 * @param text - The text to centre. Surrounding whitespace is trimmed.
	 */
	public divider(text: string): void {
		const trimmed = text.trim();
		const remaining = Math.max(0, this.dividerWidth - trimmed.length - 2);
		const left = dim("─".repeat(Math.ceil(remaining / 2)));
		const right = dim("─".repeat(Math.floor(remaining / 2)));
		console.log(`\n${left} ${bold(trimmed)} ${right}`);
	}

	/** Builds the `[timestamp] | name | LEVEL |` prefix shared by every line. */
	private prefix(level: LogLevel): string {
		const timestamp = this.includeTimestamps
			? `${gray(`[${this.timestamp()}]`)} `
			: "";
		const label = bold(LEVEL_COLORS[level](level.padEnd(5)));
		return `${timestamp}${dim("|")} ${this.name} ${dim("|")} ${label} ${dim("|")}`;
	}

	/** Renders the current time as `Day HH:mm:ss.SSS`. */
	private timestamp(): string {
		const now = new Date();
		const ms = now.getMilliseconds().toString().padStart(3, "0");
		return `${this.formatter.format(now)}.${ms}`;
	}

	/**
	 * Applies the prefix to a message. An `Error` is returned as an `Error` so
	 * that `console.error` still renders it as one.
	 */
	private format(level: LogLevel, message: unknown): Error | string {
		const prefix = this.prefix(level);

		if (message instanceof Error) {
			message.message = `${prefix} ${message.message}`;
			const stack = this.sanitizeStack(message.stack ?? "");
			if (stack) message.stack = `${message.message}\n${stack}`;
			return message;
		}

		if (typeof message === "string") return `${prefix} ${message}`;

		return `${prefix} ${inspect(message, {
			colors: true,
			depth: null,
			compact: false,
			breakLength: 0,
		})}`;
	}

	/** Rewrites stack frames into a compact, normalised tree. */
	private sanitizeStack(stack: string): string {
		return stack
			.split("\n")
			.slice(1)
			.map((line) =>
				line
					.trim()
					.replace(/\\/g, "/")
					.replace(
						/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/,
						(_, fn, file, ln, col) =>
							`  └─ ${fn} ${dim(file)} ${bold(`(L${ln} C${col})`)}`,
					)
					.replace(
						/at\s+(.+):(\d+):(\d+)/,
						(_, file, ln, col) =>
							`  └─ ${dim(file)} ${bold(`(L${ln} C${col})`)}`,
					),
			)
			.join("\n");
	}
}
