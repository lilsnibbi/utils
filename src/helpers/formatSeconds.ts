/** A time unit accepted by {@link formatSeconds}. */
export type TimeUnit = "y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms";

/** Rounding strategy applied to the smallest displayed unit. */
export type DurationRounding = "floor" | "ceil" | "round";

/** Options for {@link formatSeconds}. */
export interface FormatSecondsOptions {
	/** Includes selected units whose value is zero. Defaults to `false`. */
	includeZeroUnits?: boolean;
	/** Restricts output to these units, ordered from largest to smallest. */
	onlyUnits?: readonly TimeUnit[];
	/** Uses full labels or abbreviations. Defaults to `"long"`. */
	format?: "long" | "short";
	/** Rounds the smallest displayed unit. Defaults to `"round"`. */
	rounding?: DurationRounding;
	/** Date from which calendar-aware years and months are calculated. */
	anchorDate?: Date;
	/** Overrides the rendering of each included unit. */
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

const ALL_UNITS_ORDER: readonly TimeUnit[] = [
	"y",
	"mo",
	"w",
	"d",
	"h",
	"m",
	"s",
	"ms",
];

const LIST_FORMATTER = new Intl.ListFormat("en-US", {
	style: "long",
	type: "conjunction",
});

/**
 * Converts a duration in seconds into a human-readable English string.
 *
 * Years and months are calendar-aware when a smaller unit is also displayed.
 * When either is the smallest displayed unit, a 365-day year and average
 * 30.4167-day month are used for rounding.
 *
 * @param seconds - The duration in seconds to format.
 * @param options - Formatting options.
 * @returns A formatted duration such as `"2 hours and 30 minutes"` or `"2h 30m"`.
 * @throws {RangeError} If `anchorDate` is invalid or the duration exceeds the
 * supported JavaScript date range.
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
	const now = options.anchorDate ?? new Date();
	if (Number.isNaN(now.getTime())) {
		throw new RangeError("anchorDate must be a valid Date");
	}
	const end = new Date(now.getTime() + totalMs);
	if (Number.isNaN(end.getTime())) {
		throw new RangeError("seconds exceed the supported Date range");
	}

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
			result = LIST_FORMATTER.format(parts);
		} catch {
			const last = parts.pop();
			result = `${parts.join(", ")} and ${last}`;
		}
	} else {
		result = parts.join(format === "short" ? " " : ", ");
	}

	return isNegative ? `-${result}` : result;
}
