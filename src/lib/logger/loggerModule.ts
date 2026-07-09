import { inspect } from "node:util";
import chalk from "chalk";

export type LogLevel = "NOTIF" | "ALERT" | "ERROR" | "DEBUG";
const { cyan, yellow, red, magenta, dim, gray, bold } = chalk;

interface LogMethod {
	(message: unknown, raw: true): string;
	(message: unknown, raw?: false): void;
}

export interface LoggerOptions {
	name: string;
	timeformat?: Intl.LocalesArgument;
	includeTimestamps?: boolean;
	filterNodeModules?: boolean;
	dividerWidth?: number;
	/**
	 * Log level. Higher number = lower level logs ignored
	 * ERROR: 3,
	 * ALERT: 2,
	 * NOTIF: 1,
	 * DEBUG: 0,
	 */
	level?: LogLevel;
}

export interface Logger {
	name: string;
	level: LogLevel;
	setLevel: (level: LogLevel) => Logger;
	divider: (text: string) => void;
	notif: LogMethod;
	alert: LogMethod;
	error: LogMethod;
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

function getTimestamp(formatter: Intl.DateTimeFormat): string {
	const d = new Date();
	return `${formatter.format(d)}.${d.getMilliseconds().toString().padStart(3, "0")}`;
}

function sanitizeStack(stack: string): string {
	return stack
		.split("\n")
		.slice(1)
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
	formatter: Intl.DateTimeFormat,
): string {
	const timestamp = includeTimestamps
		? `${gray(`[${getTimestamp(formatter)}]`)} `
		: "";
	const levelLabel = bold(colors[level](level.toUpperCase().padEnd(5)));
	const prefix = `${timestamp}${dim("|")} ${name} ${dim("|")} ${levelLabel} ${dim("|")}`;

	if (message instanceof Error) {
		const sanitized = sanitizeStack(message.stack || "");
		const formattedMessage = `${prefix} ${message.message}`;
		if (sanitized) {
			return `${formattedMessage}\n${sanitized}`;
		}
		return formattedMessage;
	}

	if (typeof message === "string") {
		return `${prefix} ${message}`;
	}

	return `${prefix} ${inspect(message, { colors: true, depth: null, compact: false, breakLength: 0 })}`;
}

/**
 * Chalk-based structured logger with timestamped, color-coded output.
 * Supports levels: `NOTIF`, `ALERT`, `ERROR`, `DEBUG`.
 */
export function createLogger(ops: LoggerOptions): Logger {
	let currentLevel = ops.level ?? "DEBUG";
	const includeTimestamps = ops.includeTimestamps ?? true;
	const dividerWidth = ops.dividerWidth ?? 50;
	const formatter = new Intl.DateTimeFormat(ops.timeformat ?? "en-US", {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	function log(
		level: LogLevel,
		message: unknown,
		raw: boolean,
	): string | undefined {
		if (levelPriority[level] < levelPriority[currentLevel]) return;
		const msg = formatMessage(
			level,
			message,
			ops.name,
			includeTimestamps,
			formatter,
		);
		if (raw) return msg;
		void console[logMethods[level]](msg);
	}

	const logger: Logger = {
		name: ops.name,
		get level() {
			return currentLevel;
		},
		setLevel(newLevel: LogLevel) {
			currentLevel = newLevel;
			return this;
		},
		divider(text: string) {
			const trimmed = text.trim();
			const remaining = Math.max(0, dividerWidth - trimmed.length - 2);
			const left = dim("─".repeat(Math.ceil(remaining / 2)));
			const right = dim("─".repeat(Math.floor(remaining / 2)));
			console.log(`\n${left} ${bold(trimmed)} ${right}`);
		},
		notif: (message: unknown, raw?: boolean) =>
			log("NOTIF", message, raw ?? false) as any,
		alert: (message: unknown, raw?: boolean) =>
			log("ALERT", message, raw ?? false) as any,
		error: (message: unknown, raw?: boolean) =>
			log("ERROR", message, raw ?? false) as any,
		debug: (message: unknown, raw?: boolean) =>
			log("DEBUG", message, raw ?? false) as any,
	};

	return logger;
}
