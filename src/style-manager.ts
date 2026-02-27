/**
 * Creates or replaces a managed style element in the document head.
 * If a style element with the same ID already exists, it will be replaced.
 */
export function createManagedStyleEl(id: string): HTMLStyleElement {
	document.getElementById(id)?.remove();

	const styleEl = document.createElement("style");
	styleEl.id = id;
	document.head.appendChild(styleEl);

	return styleEl;
}
