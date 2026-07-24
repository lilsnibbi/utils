/**
 * Registry of application-specific error codes.
 *
 * Consumers can extend this interface through module augmentation.
 *
 * @example
 * ```ts
 * declare module "@lilsnibbi/utils/error" {
 *   interface AppErrorCodes {
 *     HTTPNotFound: 404;
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: Intentionally extended by consumers.
export interface AppErrorCodes {}

/**
 * Registered application error codes, or any string when the registry is empty.
 */
export type AppErrorCode = keyof AppErrorCodes extends never
	? string
	: keyof AppErrorCodes;

/** Details registered for a specific application error code. */
export type AppErrorDetails<C extends AppErrorCode> =
	C extends keyof AppErrorCodes ? AppErrorCodes[C] : unknown;

/** Additional diagnostic context attached to an {@link AppError}. */
export interface AppErrorMeta<Details = unknown> {
	/** A longer explanation of the failure. */
	reason?: string;
	/** The file or subsystem in which the error originated. */
	source?: string;
	/** The operation or control-flow context that failed. */
	context?: string;
	/** The original value that caused this error. */
	cause?: unknown;
	/** Structured details associated with the registered error code. */
	details?: Details;
	/** Searchable labels for logs and telemetry. */
	tags?: readonly string[];
	/** Removes the stack trace when `true`. Defaults to `true`. */
	omitStack?: boolean;
}

/** A typed application error with optional diagnostic metadata. */
export class AppError<C extends AppErrorCode = AppErrorCode> extends Error {
	public readonly meta: Readonly<AppErrorMeta<AppErrorDetails<C>>>;

	/**
	 * Creates an application error.
	 *
	 * @param message - A human-readable description of the failure.
	 * @param code - An application-specific code registered in {@link AppErrorCodes}.
	 * @param meta - Optional diagnostic metadata.
	 */
	constructor(
		message: string,
		public readonly code: C,
		meta?: AppErrorMeta<AppErrorDetails<C>>,
	) {
		super(message, { cause: meta?.cause });

		this.name = "AppError";
		this.meta = Object.freeze({
			omitStack: true,
			...meta,
		});

		if (this.meta.omitStack) this.stack = undefined;
	}

	/** Returns a structured summary while omitting the original cause. */
	public toJSON(): {
		name: string;
		message: string;
		code: C;
		meta: Omit<AppErrorMeta<AppErrorDetails<C>>, "cause">;
	} {
		const { cause: _cause, ...meta } = this.meta;
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			meta,
		};
	}
}

/** Checks whether a value is an {@link AppError}, optionally with a specific code. */
export function isAppError<C extends AppErrorCode>(
	value: unknown,
	code?: C,
): value is AppError<C> {
	return (
		value instanceof AppError && (code === undefined || value.code === code)
	);
}
