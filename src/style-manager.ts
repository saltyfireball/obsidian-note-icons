/**
 * Creates or replaces a managed style element in the document head.
 * If a style element with the same ID already exists, it will be replaced.
 */
export function createManagedStyleEl(id: string): HTMLStyleElement {
	document.getElementById(id)?.remove();

	// eslint-disable-next-line obsidianmd/no-forbidden-elements -- dynamic CSS requires a style element
	const styleEl = document.createElement("style");
	styleEl.id = id;
	document.head.appendChild(styleEl);

	return styleEl;
}
