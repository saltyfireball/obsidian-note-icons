import type NoteIconsPlugin from "../main";
import type { PatternType } from "../settings";
import {
	applyPatternClasses,
	applyPatternToActiveLeaves,
	setupPatternObserver,
} from "./matching";

/** Search filter state for pattern settings UI */
export const patternSearchFilters: Record<PatternType, string> = {
	file: "",
	folder: "",
};

/**
 * Register the patterns feature on the plugin.
 * Sets up the mutation observer for file explorer pattern matching,
 * and applies patterns to already-open leaves on layout ready.
 */
export function registerPatterns(plugin: NoteIconsPlugin): void {
	const observer = setupPatternObserver(plugin);

	// Clean up observer when plugin unloads
	plugin.register(() => {
		observer.disconnect();
	});

	plugin.app.workspace.onLayoutReady(() => {
		applyPatternToActiveLeaves(plugin);
	});

	// Apply patterns when files are opened
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", (file) => {
			if (file) {
				applyPatternToActiveLeaves(plugin);
			}
		}),
	);

	// Re-apply patterns on layout changes (debounced)
	let layoutDebounce: ReturnType<typeof setTimeout> | null = null;
	plugin.registerEvent(
		plugin.app.workspace.on("layout-change", () => {
			if (layoutDebounce) clearTimeout(layoutDebounce);
			layoutDebounce = setTimeout(() => {
				layoutDebounce = null;
				applyPatternToActiveLeaves(plugin);
			}, 50);
		}),
	);
	plugin.register(() => {
		if (layoutDebounce) clearTimeout(layoutDebounce);
	});
}

export { applyPatternClasses, applyPatternToActiveLeaves };
