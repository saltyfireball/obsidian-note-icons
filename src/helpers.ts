export function normalizeFontSize(value?: string | null): string {
	const trimmed = (value || "").trim();
	if (!trimmed) return "";
	if (/^\d+$/.test(trimmed)) {
		return `${trimmed}px`;
	}
	return trimmed;
}

export function isHexColor(value?: string | null): boolean {
	return /^#[0-9A-Fa-f]{6}$/.test((value || "").trim());
}

export function escapeAttributeValue(value?: string | null): string {
	return (value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Sanitize a CSS value to prevent injection via semicolons, braces, etc.
 * Strips characters that could break out of a CSS declaration.
 */
export function sanitizeCssValue(value?: string | null): string {
	if (!value) return "";
	return value.replace(/[{}<>;@\\]/g, "").trim();
}

/**
 * Deep merge two objects. Arrays from `overrides` replace `defaults` entirely.
 * Plain objects are merged recursively so new default keys are preserved.
 */
export function deepMerge<T extends Record<string, unknown>>(
	defaults: T,
	overrides: Record<string, unknown>,
): T {
	const result = { ...defaults };
	for (const key of Object.keys(overrides)) {
		const defaultVal = (defaults as Record<string, unknown>)[key];
		const overrideVal = overrides[key];
		if (
			overrideVal !== null &&
			overrideVal !== undefined &&
			typeof overrideVal === "object" &&
			!Array.isArray(overrideVal) &&
			typeof defaultVal === "object" &&
			defaultVal !== null &&
			!Array.isArray(defaultVal)
		) {
			(result as Record<string, unknown>)[key] = deepMerge(
				defaultVal as Record<string, unknown>,
				overrideVal as Record<string, unknown>,
			);
		} else {
			(result as Record<string, unknown>)[key] = overrideVal;
		}
	}
	return result;
}
