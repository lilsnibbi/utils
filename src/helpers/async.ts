/** Options for {@link retry}. */
export interface RetryOptions {
	/** Total attempts, including the first call. Defaults to `3`. */
	attempts?: number;
	/** Delay before the second attempt in milliseconds. Defaults to `0`. */
	delay?: number;
	/** Multiplier applied to the delay after each failure. Defaults to `1`. */
	backoff?: number;
	/** Stops retries when aborted. */
	signal?: AbortSignal;
	/** Decides whether a failure should be retried. */
	shouldRetry?: (error: unknown, attempt: number) => boolean | Promise<boolean>;
}

/** Resolves after a delay, or rejects with the abort reason. */
export function sleep(
	milliseconds: number,
	signal?: AbortSignal,
): Promise<void> {
	if (!Number.isFinite(milliseconds) || milliseconds < 0) {
		throw new RangeError("milliseconds must be a non-negative finite number");
	}
	if (signal?.aborted) return Promise.reject(signal.reason);

	return new Promise((resolve, reject) => {
		const onAbort = () => {
			clearTimeout(timeout);
			reject(signal?.reason);
		};
		const timeout = setTimeout(() => {
			signal?.removeEventListener("abort", onAbort);
			resolve();
		}, milliseconds);
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}

/**
 * Retries an asynchronous operation with optional delay and backoff.
 *
 * The callback receives a one-based attempt number.
 */
export async function retry<T>(
	operation: (attempt: number) => T | Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const { attempts = 3, delay = 0, backoff = 1, signal, shouldRetry } = options;
	if (!Number.isSafeInteger(attempts) || attempts < 1) {
		throw new RangeError("attempts must be a positive integer");
	}
	if (!Number.isFinite(delay) || delay < 0) {
		throw new RangeError("delay must be a non-negative finite number");
	}
	if (!Number.isFinite(backoff) || backoff < 0) {
		throw new RangeError("backoff must be a non-negative finite number");
	}

	let nextDelay = delay;
	for (let attempt = 1; ; attempt++) {
		signal?.throwIfAborted();
		try {
			return await operation(attempt);
		} catch (error) {
			if (
				attempt >= attempts ||
				(shouldRetry && !(await shouldRetry(error, attempt)))
			) {
				throw error;
			}
			if (nextDelay > 0) await sleep(nextDelay, signal);
			nextDelay *= backoff;
		}
	}
}
