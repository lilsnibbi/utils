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
	 * Log leve. Higher number = lower level logs ignored
	- ERROR: 3,
	- ALERT: 2,
	- NOTIF: 1,
	- DEBUG: 0,
	 */
	level?: LogLevel;
}

/**
 * Chalk-based structured logger with timestamped, color-coded output.
 * Supports levels: `NOTIF`, `ALERT`, `ERROR`, `DEBUG`.
 */
export class LoggerModule {
	public name: string;
	public level: LogLevel;
	private formatter: Intl.DateTimeFormat;
	private includeTimestamps: boolean;
	private dividerWidth: number;

	private readonly colors: Record<LogLevel, typeof chalk> = {
		NOTIF: cyan,
		ALERT: yellow,
		ERROR: red,
		DEBUG: magenta,
	};

	private readonly logMethods: Record<
		LogLevel,
		"log" | "warn" | "error" | "debug"
	> = {
		NOTIF: "log",
		ALERT: "warn",
		ERROR: "error",
		DEBUG: "debug",
	};

	private readonly levelPriority: Record<LogLevel, number> = {
		DEBUG: 0,
		NOTIF: 1,
		ALERT: 2,
		ERROR: 3,
	};

	constructor(ops: LoggerOptions) {
		this.name = ops.name;
		this.level = ops.level ?? "DEBUG";
		this.includeTimestamps = ops.includeTimestamps ?? true;
		this.dividerWidth = ops.dividerWidth ?? 50;
		this.formatter = new Intl.DateTimeFormat(ops.timeformat ?? "en-US", {
			weekday: "short",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}

	/** Sets the minimum log level to display. */
	public setLevel(level: LogLevel): this {
		this.level = level;
		return this;
	}

	private getTimestamp(): string {
		const d = new Date();
		return `${this.formatter.format(d)}.${d.getMilliseconds().toString().padStart(3, "0")}`;
	}

	private formatMessage(level: LogLevel, message: unknown): Error | string {
		const timestamp = this.includeTimestamps
			? `${gray(`[${this.getTimestamp()}]`)} `
			: "";
		const levelLabel = bold(this.colors[level](level.toUpperCase().padEnd(5)));
		const prefix = `${timestamp}${dim("|")} ${this.name} ${dim("|")} ${levelLabel} ${dim("|")}`;

		if (message instanceof Error) {
			const sanitized = this.sanitizeStack(message.stack || "");
			message.message = `${prefix} ${message.message}`;
			if (sanitized) {
				message.stack = `${message.message}\n${sanitized}`;
			}
			return message;
		}

		if (typeof message === "string") {
			return `${prefix} ${message}`;
		}

		return `${prefix} ${inspect(message, { colors: true, depth: null, compact: false, breakLength: 0 })}`;
	}

	private sanitizeStack(stack: string): string {
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

	/** Prints a centered `─` divider line with the given text. */
	public divider(text: string): void {
		const trimmed = text.trim();
		const remaining = Math.max(0, this.dividerWidth - trimmed.length - 2);
		const left = dim("─".repeat(Math.ceil(remaining / 2)));
		const right = dim("─".repeat(Math.floor(remaining / 2)));
		console.log(`\n${left} ${bold(trimmed)} ${right}`);
	}

	private log(
		level: LogLevel,
		message: unknown,
		raw: boolean,
	): string | undefined {
		if (this.levelPriority[level] < this.levelPriority[this.level]) return;
		const msg = this.formatMessage(level, message);
		if (raw) {
			return msg instanceof Error ? msg.stack || msg.message : msg;
		}
		void console[this.logMethods[level]](msg);
	}

	public notif: LogMethod = (message: unknown, raw?: boolean) =>
		this.log("NOTIF", message, raw ?? false) as string & undefined;

	public alert: LogMethod = (message: unknown, raw?: boolean) =>
		this.log("ALERT", message, raw ?? false) as string & undefined;

	public error: LogMethod = (message: unknown, raw?: boolean) =>
		this.log("ERROR", message, raw ?? false) as string & undefined;

	public debug: LogMethod = (message: unknown, raw?: boolean) =>
		this.log("DEBUG", message, raw ?? false) as string & undefined;
}
