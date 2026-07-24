import { inspect } from "node:util";
import chalk from "chalk";

/** Severity levels supported by the logger. */
export type LogLevel = "NOTIF" | "ALERT" | "ERROR" | "DEBUG";
const { cyan, yellow, red, magenta, dim, gray, bold } = chalk;

/** A logger method that can write output or return its formatted value. */
export interface LogMethod {
	/** Formats and returns a message without writing to the console. */
	(message: unknown, raw: true): string;
	/** Writes a formatted message to the console. */
	(message: unknown, raw?: false): void;
}

/** Structured information passed to a custom logger output. */
export interface LogEntry {
	readonly level: LogLevel;
	readonly name: string;
	readonly message: unknown;
	readonly formatted: string;
	readonly timestamp: Date;
}

/** Options for {@link createLogger}. */
export interface LoggerOptions {
	/** Name displayed in each log entry. */
	name: string;
	/** Locale or locales used for timestamps. Defaults to `"en-US"`. */
	timeformat?: Intl.LocalesArgument;
	/** Includes a timestamp in each entry. Defaults to `true`. */
	includeTimestamps?: boolean;
	/** Removes `node_modules` frames from error stacks. Defaults to `false`. */
	filterNodeModules?: boolean;
	/** Target width of divider lines. Defaults to `50`. */
	dividerWidth?: number;
	/**
	 * Minimum severity written to the console. Defaults to `"DEBUG"`.
	 *
	 * Priority from lowest to highest is `DEBUG`, `NOTIF`, `ALERT`, `ERROR`.
	 */
	level?: LogLevel;
	/** Receives enabled log entries instead of writing to the console. */
	output?: (entry: LogEntry) => void;
	/** Maximum object inspection depth. Defaults to unlimited. */
	inspectDepth?: number | null;
	/** Supplies timestamps. Useful for deterministic tests. */
	now?: () => Date;
}

/** A structured console logger created by {@link createLogger}. */
export interface Logger {
	/** Name displayed in log entries. */
	readonly name: string;
	/** Current minimum severity. */
	readonly level: LogLevel;
	/** Updates the minimum severity and returns this logger. */
	setLevel(level: LogLevel): Logger;
	/** Returns whether a severity is currently enabled. */
	isEnabled(level: LogLevel): boolean;
	/** Formats a value without writing it. */
	format(level: LogLevel, message: unknown): string;
	/** Writes or formats a value at a dynamic severity. */
	log(level: LogLevel, message: unknown, raw: true): string;
	log(level: LogLevel, message: unknown, raw?: false): void;
	/** Creates an independently configurable child logger. */
	child(name: string, options?: Partial<Omit<LoggerOptions, "name">>): Logger;
	/** Writes a centered divider to `console.log`. */
	divider(text: string): void;
	/** Writes or formats a notification. */
	notif: LogMethod;
	/** Writes or formats an alert. */
	alert: LogMethod;
	/** Writes or formats an error. */
	error: LogMethod;
	/** Writes or formats a debug entry. */
	debug: LogMethod;
}

const colors: Record<LogLevel, typeof chalk> = {
	NOTIF: cyan,
	ALERT: yellow,
	ERROR: red,
	DEBUG: magenta,
};

const logMethods: Record<LogLevel, "log" | "warn" | "error" | "debug"> = {
	NOTIF: "log",
	ALERT: "warn",
	ERROR: "error",
	DEBUG: "debug",
};

const levelPriority: Record<LogLevel, number> = {
	DEBUG: 0,
	NOTIF: 1,
	ALERT: 2,
	ERROR: 3,
};

function getTimestamp(formatter: Intl.DateTimeFormat, d: Date): string {
	return `${formatter.format(d)}.${d.getMilliseconds().toString().padStart(3, "0")}`;
}

function sanitizeStack(stack: string, filterNodeModules: boolean): string {
	return stack
		.split("\n")
		.slice(1)
		.filter((line) => !filterNodeModules || !line.includes("node_modules"))
		.map((line) => {
			return line
				.trim()
				.replace(/\\/g, "/")
				.replace(
					/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/,
					(_, fn, f, l, c) => `  └─ ${fn} ${dim(f)} ${bold(`(L${l} C${c})`)}`,
				)
				.replace(
					/at\s+(.+):(\d+):(\d+)/,
					(_, f, l, c) => `  └─ ${dim(f)} ${bold(`(L${l} C${c})`)}`,
				);
		})
		.join("\n");
}

function formatMessage(
	level: LogLevel,
	message: unknown,
	name: string,
	includeTimestamps: boolean,
	filterNodeModules: boolean,
	formatter: Intl.DateTimeFormat,
	date: Date,
	inspectDepth: number | null,
): string {
	const timestamp = includeTimestamps
		? `${gray(`[${getTimestamp(formatter, date)}]`)} `
		: "";
	const levelLabel = bold(colors[level](level.toUpperCase().padEnd(5)));
	const prefix = `${timestamp}${dim("|")} ${name} ${dim("|")} ${levelLabel} ${dim("|")}`;

	if (message instanceof Error) {
		const sanitized = sanitizeStack(message.stack ?? "", filterNodeModules);
		const formattedMessage = `${prefix} ${message.message}`;
		if (sanitized) {
			return `${formattedMessage}\n${sanitized}`;
		}
		return formattedMessage;
	}

	if (typeof message === "string") {
		return `${prefix} ${message}`;
	}

	return `${prefix} ${inspect(message, { colors: true, depth: inspectDepth, compact: false, breakLength: 0 })}`;
}

/**
 * Creates a Chalk-based structured logger.
 *
 * Each severity writes to its matching console method. Passing `true` as a log
 * method's second argument returns the formatted string without writing it.
 *
 * @param options - Logger configuration.
 * @returns A stateful logger instance.
 */
export function createLogger(options: LoggerOptions): Logger {
	let currentLevel = options.level ?? "DEBUG";
	const includeTimestamps = options.includeTimestamps ?? true;
	const filterNodeModules = options.filterNodeModules ?? false;
	const dividerWidth = Math.max(0, Math.floor(options.dividerWidth ?? 50));
	const inspectDepth = options.inspectDepth ?? null;
	const now = options.now ?? (() => new Date());
	const formatter = new Intl.DateTimeFormat(options.timeformat ?? "en-US", {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	function write(level: LogLevel, message: unknown, raw: true): string;
	function write(level: LogLevel, message: unknown, raw: false): void;
	function write(
		level: LogLevel,
		message: unknown,
		raw: boolean,
	): string | undefined {
		const timestamp = now();
		const msg = formatMessage(
			level,
			message,
			options.name,
			includeTimestamps,
			filterNodeModules,
			formatter,
			timestamp,
			inspectDepth,
		);
		if (raw) return msg;
		if (levelPriority[level] < levelPriority[currentLevel]) return;
		if (options.output) {
			options.output({
				level,
				name: options.name,
				message,
				formatted: msg,
				timestamp,
			});
			return;
		}
		void console[logMethods[level]](msg);
	}

	function createLogMethod(level: LogLevel): LogMethod {
		function method(message: unknown, raw: true): string;
		function method(message: unknown, raw?: false): void;
		function method(message: unknown, raw = false): string | undefined {
			if (raw) return write(level, message, true);
			write(level, message, false);
		}

		return method;
	}

	function dynamicLog(level: LogLevel, message: unknown, raw: true): string;
	function dynamicLog(level: LogLevel, message: unknown, raw?: false): void;
	function dynamicLog(
		level: LogLevel,
		message: unknown,
		raw = false,
	): string | undefined {
		if (raw) return write(level, message, true);
		write(level, message, false);
	}

	const logger: Logger = {
		name: options.name,
		get level() {
			return currentLevel;
		},
		setLevel(newLevel: LogLevel) {
			currentLevel = newLevel;
			return this;
		},
		isEnabled(level: LogLevel) {
			return levelPriority[level] >= levelPriority[currentLevel];
		},
		format(level: LogLevel, message: unknown) {
			return write(level, message, true);
		},
		log: dynamicLog,
		child(name, overrides = {}) {
			return createLogger({
				...options,
				...overrides,
				name: `${options.name}:${name}`,
				level: overrides.level ?? currentLevel,
			});
		},
		divider(text: string) {
			const trimmed = text.trim();
			const remaining = Math.max(0, dividerWidth - trimmed.length - 2);
			const left = dim("─".repeat(Math.ceil(remaining / 2)));
			const right = dim("─".repeat(Math.floor(remaining / 2)));
			console.log(`\n${left} ${bold(trimmed)} ${right}`);
		},
		notif: createLogMethod("NOTIF"),
		alert: createLogMethod("ALERT"),
		error: createLogMethod("ERROR"),
		debug: createLogMethod("DEBUG"),
	};

	return logger;
}
