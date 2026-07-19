/** Options for {@link isLink}. */
export interface IsLinkOptions {
	/** Allowed protocols, with or without a trailing colon. Defaults to HTTP and HTTPS. */
	protocols?: readonly string[];
}

const DEFAULT_PROTOCOLS = ["http", "https"] as const;

/**
 * Checks whether a string is a parseable URL using an allowed protocol.
 *
 * Protocol matching is case-insensitive. Leading and trailing whitespace is
 * ignored, matching the platform URL parser.
 *
 * @param value - The value to validate.
 * @param options - Optional protocol restrictions.
 * @returns `true` when the value is a valid URL with an allowed protocol.
 */
export function isLink(value: string, options: IsLinkOptions = {}): boolean {
	const protocols = new Set(
		(options.protocols ?? DEFAULT_PROTOCOLS).map((protocol) =>
			protocol.toLowerCase().replace(/:$/, ""),
		),
	);

	const normalizedValue = value.trim();
	const colonIndex = normalizedValue.indexOf(":");
	if (colonIndex < 1) return false;

	const protocol = normalizedValue.slice(0, colonIndex).toLowerCase();
	if (!protocols.has(protocol)) return false;

	return URL.canParse(normalizedValue);
}
