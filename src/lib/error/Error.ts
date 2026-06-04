export interface AppErrorCodes extends Record<string, unknown> {}

export class AppError extends Error {
	constructor(
		/**
		 * Error message. What happened?
		 */
		message: string,
		/**
		 * Error code.
		 * @example To extend the `AppErrorCodes` interface:
		 * declare module "@lilsnibbi/utils" {
		 *   interface AppErrorCodes {
		 *       "Critical": "Something really bad happened!",
		 *       "HTTPNotFound": 404
		 *    }
		 * }
		 */
		public readonly code: keyof AppErrorCodes,
		public readonly meta?: {
			/** Long description of what happened */
			reason?: string;
			/** Filepath where this came from */
			source?: string;
			/** Where this was thrown e.g. if statement, loop etc */
			context?: string;
			/** Original error that caused this */
			cause?: unknown;
			/** Hide the stack trace */
			omitStack: boolean;
		},
	) {
		super(message, { cause: meta?.cause });

		this.name = "AppError";
		this.meta = {
			omitStack: true,
			...meta,
		};

		if (this.meta.omitStack) this.stack = undefined;

		Object.setPrototypeOf(this, AppError.prototype);
	}
}
