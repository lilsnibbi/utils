const pluralRules = new Intl.PluralRules("en-US", { type: "ordinal" });
const suffixes: Record<Intl.LDMLPluralRule, string> = {
	one: "st",
	two: "nd",
	few: "rd",
	other: "th",
	zero: "th",
	many: "th",
};

/**
 * Converts a number to its English ordinal string (e.g. 1 → "1st", 12 → "12th").
 *
 * This function uses `Intl.PluralRules` to determine the correct suffix based on English
 * grammatical rules, correctly handling cases like 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, etc.
 *
 * @param n - The number to convert.
 * @returns The number with its ordinal suffix appended.
 *
 * @example
 * ```ts
 * toOrdinal(1); // "1st"
 * toOrdinal(22); // "22nd"
 * toOrdinal(113); // "113th"
 * ```
 */
export function toOrdinal(n: number): string {
	const rule = pluralRules.select(n);
	const suffix = suffixes[rule] ?? "th";
	return `${n}${suffix}`;
}
