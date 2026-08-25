/** Time units {@link formatSeconds} can emit, largest to smallest. */
export type TimeUnit = "y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms";

/** How the smallest emitted unit is rounded. */
export type RoundingMode = "floor" | "ceil" | "round";

/** Output style: full words or single-letter abbreviations. */
export type DurationFormat = "long" | "short";

/** Options accepted by {@link formatSeconds}. */
export interface FormatSecondsOptions {
	/** Emit units whose value is zero. Defaults to `false`. */
	includeZeroUnits?: boolean;
	/** Restrict output to these units. Defaults to all of them. */
	onlyUnits?: TimeUnit[];
	/** `"long"` for full words, `"short"` for abbreviations. Defaults to `"long"`. */
	format?: DurationFormat;
	/** How to round the smallest emitted unit. Defaults to `"round"`. */
	rounding?: RoundingMode;
	/**
	 * Renders a single unit, replacing the built-in rendering.
	 * @param unit - The unit being rendered.
	 * @param value - Its numeric value.
	 * @param label - The pluralised long label, or the short label in `"short"` mode.
	 */
	customFormatter?: (unit: TimeUnit, value: number, label: string) => string;
}

const UNITS: Record<TimeUnit, { label: string; short: string; ms: number }> = {
	y: { label: "year", short: "y", ms: 31536000000 },
	mo: { label: "month", short: "mo", ms: 2628000000 },
	w: { label: "week", short: "w", ms: 604800000 },
	d: { label: "day", short: "d", ms: 86400000 },
	h: { label: "hour", short: "h", ms: 3600000 },
	m: { label: "minute", short: "m", ms: 60000 },
	s: { label: "second", short: "s", ms: 1000 },
	ms: { label: "millisecond", short: "ms", ms: 1 },
};

const ALL_UNITS_ORDER: TimeUnit[] = ["y", "mo", "w", "d", "h", "m", "s", "ms"];

/**
 * Converts a duration in seconds into a human-readable string.
 *
 * Years and months are calendar-aware: they are measured against the current
 * date rather than fixed averages, so the result respects leap years and
 * varying month lengths. Smaller units fall back to fixed arithmetic.
 *
 * @param seconds - The duration in seconds. Non-finite values yield zero.
 * @param options - See {@link FormatSecondsOptions}.
 * @returns The formatted duration, negated with a leading `-` when `seconds` is
 * negative.
 *
 * @example
 * ```ts
 * formatSeconds(9000);                      // "2 hours and 30 minutes"
 * formatSeconds(9000, { format: "short" }); // "2h 30m"
 * formatSeconds(9000, { onlyUnits: ["h"] }); // "3 hours"
 * ```
 */
export function formatSeconds(
	seconds: number,
	options: FormatSecondsOptions = {},
): string {
	const {
		includeZeroUnits = false,
		onlyUnits = [],
		format = "long",
		rounding = "round",
		customFormatter,
	} = options;

	if (!Number.isFinite(seconds)) return format === "short" ? "0s" : "0 seconds";

	const isNegative = seconds < 0;
	const absSeconds = Math.abs(seconds);

	const unitsToDisplay = onlyUnits.length
		? ALL_UNITS_ORDER.filter((u) => onlyUnits.includes(u))
		: ALL_UNITS_ORDER;

	const lastUnit = unitsToDisplay[unitsToDisplay.length - 1] ?? "s";

	// If we are rounding to a unit larger than ms, we should do it at that level
	let totalMs = Math.round(absSeconds * 1000);

	const diff: Partial<Record<TimeUnit, number>> = {};
	const now = new Date();
	const end = new Date(now.getTime() + totalMs);

	if (unitsToDisplay.includes("y")) {
		let y = end.getFullYear() - now.getFullYear();
		const afterYears = new Date(now);
		afterYears.setFullYear(now.getFullYear() + y);
		if (afterYears > end) y--;

		if (lastUnit === "y") {
			const totalY = absSeconds / (UNITS.y.ms / 1000);
			diff.y = Math.max(0, Math[rounding](totalY));
			totalMs = 0;
		} else {
			diff.y = Math.max(0, y);
			totalMs -=
				new Date(now).setFullYear(now.getFullYear() + diff.y) - now.getTime();
		}
	}

	if (totalMs > 0 && unitsToDisplay.includes("mo")) {
		const startTotalMonths = now.getFullYear() * 12 + now.getMonth();
		const endTotalMonths = end.getFullYear() * 12 + end.getMonth();
		let mo = endTotalMonths - startTotalMonths;
		if (diff.y !== undefined) mo -= diff.y * 12;

		const afterYearsAndMonths = new Date(now);
		afterYearsAndMonths.setFullYear(now.getFullYear() + (diff.y ?? 0));
		afterYearsAndMonths.setMonth(now.getMonth() + mo);
		if (afterYearsAndMonths > end) mo--;

		if (lastUnit === "mo") {
			const totalMo =
				(absSeconds - (diff.y ?? 0) * (UNITS.y.ms / 1000)) /
				(UNITS.mo.ms / 1000);
			diff.mo = Math.max(0, Math[rounding](totalMo));
			totalMs = 0;
		} else {
			diff.mo = Math.max(0, mo);
			const jumpDate = new Date(now);
			jumpDate.setFullYear(now.getFullYear() + (diff.y ?? 0));
			jumpDate.setMonth(now.getMonth() + diff.mo);
			totalMs = end.getTime() - jumpDate.getTime();
		}
	}

	for (const unit of ["w", "d", "h", "m", "s", "ms"] as const) {
		if (unitsToDisplay.includes(unit)) {
			if (unit === lastUnit) {
				diff[unit] = Math[rounding](totalMs / UNITS[unit].ms);
				totalMs = 0;
			} else {
				diff[unit] = Math.floor(totalMs / UNITS[unit].ms);
				totalMs %= UNITS[unit].ms;
			}
		}
	}

	const parts: string[] = [];
	for (const unit of unitsToDisplay) {
		const value = diff[unit] ?? 0;
		if (value > 0 || includeZeroUnits) {
			const label =
				format === "short"
					? UNITS[unit].short
					: value === 1
						? UNITS[unit].label
						: `${UNITS[unit].label}s`;

			parts.push(
				customFormatter
					? customFormatter(unit, value, label)
					: format === "short"
						? `${value}${label}`
						: `${value} ${label}`,
			);
		}
	}

	if (parts.length === 0) {
		const zero = format === "short" ? "0s" : "0 seconds";
		return isNegative ? `-${zero}` : zero;
	}

	let result: string;
	if (format === "long" && parts.length > 1) {
		try {
			const formatter = new Intl.ListFormat("en-US", {
				style: "long",
				type: "conjunction",
			});
			result = formatter.format(parts);
		} catch {
			const last = parts.pop();
			result = `${parts.join(", ")} and ${last}`;
		}
	} else {
		result = parts.join(format === "short" ? " " : ", ");
	}

	return isNegative ? `-${result}` : result;
}
