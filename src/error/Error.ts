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

/** Additional diagnostic context attached to an {@link AppError}. */
export interface AppErrorMeta {
	/** A longer explanation of the failure. */
	reason?: string;
	/** The file or subsystem in which the error originated. */
	source?: string;
	/** The operation or control-flow context that failed. */
	context?: string;
	/** The original value that caused this error. */
	cause?: unknown;
	/** Removes the stack trace when `true`. Defaults to `true`. */
	omitStack?: boolean;
}

/** A typed application error with optional diagnostic metadata. */
export class AppError extends Error {
	/**
	 * Creates an application error.
	 *
	 * @param message - A human-readable description of the failure.
	 * @param code - An application-specific code registered in {@link AppErrorCodes}.
	 * @param meta - Optional diagnostic metadata.
	 */
	constructor(
		message: string,
		public readonly code: AppErrorCode,
		public readonly meta?: AppErrorMeta,
	) {
		super(message, { cause: meta?.cause });

		this.name = "AppError";
		this.meta = Object.freeze({
			omitStack: true,
			...meta,
		});

		if (this.meta.omitStack) this.stack = undefined;
	}
}
