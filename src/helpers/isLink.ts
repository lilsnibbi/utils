/** Options for {@link isLink}. */
export interface IsLinkOptions {
	/** Allowed protocols, with or without a trailing colon. Defaults to HTTP and HTTPS. */
	protocols?: readonly string[];
	/** Allowed hostnames. Matching is case-insensitive. */
	hosts?: readonly string[];
	/** Allows credentials embedded in the URL. Defaults to `true`. */
	allowCredentials?: boolean;
	/** Requires a non-empty hostname. Defaults to `false`. */
	requireHostname?: boolean;
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
 * @returns The parsed URL, or `undefined` when validation fails.
 */
export function parseLink(
	value: string,
	options: IsLinkOptions = {},
): URL | undefined {
	const protocols = new Set(
		(options.protocols ?? DEFAULT_PROTOCOLS).map((protocol) =>
			protocol.toLowerCase().replace(/:$/, ""),
		),
	);

	const normalizedValue = value.trim();
	const colonIndex = normalizedValue.indexOf(":");
	if (colonIndex < 1) return;

	const protocol = normalizedValue.slice(0, colonIndex).toLowerCase();
	if (!protocols.has(protocol) || !URL.canParse(normalizedValue)) return;

	const url = new URL(normalizedValue);
	if (options.requireHostname && !url.hostname) return;
	if (
		options.allowCredentials === false &&
		(url.username.length > 0 || url.password.length > 0)
	) {
		return;
	}
	if (options.hosts) {
		const hosts = new Set(options.hosts.map((host) => host.toLowerCase()));
		if (!hosts.has(url.hostname.toLowerCase())) return;
	}

	return url;
}

/**
 * Checks whether a string is a parseable URL using the supplied restrictions.
 */
export function isLink(value: string, options: IsLinkOptions = {}): boolean {
	return parseLink(value, options) !== undefined;
}
