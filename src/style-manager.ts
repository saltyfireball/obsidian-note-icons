/**
 * Creates a managed CSSStyleSheet and adopts it into the document.
 */
export function createManagedStyleSheet(): CSSStyleSheet {
	const sheet = new CSSStyleSheet();
	document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
	return sheet;
}
