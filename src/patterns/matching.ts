import type { MarkdownView } from "obsidian";
import type NoteIconsPlugin from "../main";
import type { FilePattern, FolderPattern } from "../settings";

// Cache compiled regexes to avoid recompiling on every mutation
const regexCache = new Map<string, RegExp | null>();

/**
 * Parse a pattern string that may include regex delimiters and flags.
 * Supports formats:
 *   - `/pattern/flags` (e.g., `/AWS SAM Local/i`)
 *   - `pattern` (plain regex without flags)
 */
function parsePatternWithFlags(pattern: string): {
	pattern: string;
	flags: string;
} {
	const match = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
	if (match && match[1] !== undefined) {
		return { pattern: match[1], flags: match[2] || "" };
	}
	return { pattern, flags: "" };
}

function getRegex(pattern: string): RegExp | null {
	if (regexCache.has(pattern)) return regexCache.get(pattern)!;
	try {
		const { pattern: regexPattern, flags } = parsePatternWithFlags(pattern);
		const regex = new RegExp(regexPattern, flags);
		regexCache.set(pattern, regex);
		return regex;
	} catch {
		regexCache.set(pattern, null);
		return null;
	}
}

/** Clear the regex cache (call when patterns change in settings). */
export function clearPatternCache(): void {
	regexCache.clear();
}

/**
 * Test a regex against a string with a step limit to prevent ReDoS.
 * Falls back to `false` if the regex takes too many steps.
 */
function safeRegexTest(regex: RegExp, input: string): boolean {
	if (input.length > 500) return false;
	try {
		return regex.test(input);
	} catch {
		return false;
	}
}

let applyScheduled = false;

export function applyPatternClasses(plugin: NoteIconsPlugin): void {
	const filePatterns = plugin.settings.filePatterns || [];
	const folderPatterns = plugin.settings.folderPatterns || [];

	document.querySelectorAll('[class*="sf-pattern-"]').forEach((el) => {
		el.className = el.className
			.replace(/sf-pattern-(file|folder)-\d+/g, "")
			.trim();
	});

	document.querySelectorAll(".nav-file").forEach((fileEl) => {
		const titleEl = fileEl.querySelector(".nav-file-title");
		if (!titleEl) return;
		const path = titleEl.getAttribute("data-path");
		if (!path) return;

		if (plugin.settings.fileStyles && plugin.settings.fileStyles[path])
			return;

		for (let i = 0; i < filePatterns.length; i++) {
			const pattern = filePatterns[i];
			if (!pattern) continue;
			const regex = getRegex(pattern.pattern);
			if (regex && safeRegexTest(regex, path)) {
				fileEl.classList.add(`sf-pattern-file-${i}`);
				break;
			}
		}
	});

	document.querySelectorAll(".nav-folder").forEach((folderEl) => {
		const titleEl = folderEl.querySelector(":scope > .nav-folder-title");
		if (!titleEl) return;
		const path = titleEl.getAttribute("data-path");
		if (!path) return;

		if (plugin.settings.folderStyles && plugin.settings.folderStyles[path])
			return;

		for (let i = 0; i < folderPatterns.length; i++) {
			const pattern = folderPatterns[i];
			if (!pattern) continue;
			const regex = getRegex(pattern.pattern);
			if (regex && safeRegexTest(regex, path)) {
				folderEl.classList.add(`sf-pattern-folder-${i}`);
				break;
			}
		}
	});
}

export function applyPatternToActiveLeaves(plugin: NoteIconsPlugin): void {
	const filePatterns = plugin.settings.filePatterns || [];

	plugin.app.workspace.iterateAllLeaves((leaf) => {
		const view = leaf.view;
		if (!view || (view.getViewType && view.getViewType() !== "markdown"))
			return;

		const markdownView = view as MarkdownView;
		const file = markdownView.file;
		if (!file) return;

		const path = file.path;
		const containerEl = view.containerEl;

		containerEl.className = containerEl.className
			.replace(/sf-pattern-file-\d+/g, "")
			.trim();

		if (plugin.settings.fileStyles && plugin.settings.fileStyles[path])
			return;

		for (let i = 0; i < filePatterns.length; i++) {
			const pattern = filePatterns[i];
			if (!pattern) continue;
			const regex = getRegex(pattern.pattern);
			if (regex && safeRegexTest(regex, path)) {
				containerEl.classList.add(`sf-pattern-file-${i}`);
				break;
			}
		}
	});
}

export function setupPatternObserver(plugin: NoteIconsPlugin): MutationObserver {
	applyPatternClasses(plugin);

	const debouncedApply = () => {
		if (applyScheduled) return;
		applyScheduled = true;
		requestAnimationFrame(() => {
			applyScheduled = false;
			applyPatternClasses(plugin);
		});
	};

	const observer = new MutationObserver(debouncedApply);

	const observeFileExplorer = () => {
		const fileExplorer = document.querySelector(".nav-files-container");
		if (fileExplorer) {
			observer.observe(fileExplorer, {
				childList: true,
				subtree: true,
			});
			applyPatternClasses(plugin);
		} else {
			setTimeout(observeFileExplorer, 500);
		}
	};

	observeFileExplorer();
	return observer;
}
