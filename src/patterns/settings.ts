import type { App as ObsidianApp } from "obsidian";
import type NoteIconsPlugin from "../main";
import type {
	FilePattern,
	FolderPattern,
	IconDefinition,
	PatternType,
} from "../settings";
import { PatternModal } from "./pattern-modal";
import { patternSearchFilters } from "./register";
import { applyPatternClasses, applyPatternToActiveLeaves } from "./matching";

interface SettingsTabContext {
	app: ObsidianApp;
	plugin: NoteIconsPlugin;
	contentEl: HTMLElement;
	rerender: () => void;
	scrollContainer?: HTMLElement;
}

type PatternEntry = FilePattern | FolderPattern;

function getPatternArray(
	plugin: NoteIconsPlugin,
	type: PatternType,
): PatternEntry[] {
	return type === "file"
		? plugin.settings.filePatterns
		: plugin.settings.folderPatterns;
}

function rerenderPreservingScroll(
	context: SettingsTabContext,
	target?: { type: PatternType; index: number },
): void {
	const { contentEl, rerender, scrollContainer } = context;
	const container = scrollContainer ?? contentEl;
	const scrollTop = container.scrollTop;
	rerender();
	container.scrollTop = scrollTop;
	if (target) {
		scrollTargetPatternIntoView(container, target);
	}
}

function rerenderPatternListOnly(
	listContainer: HTMLElement,
	renderCallback: () => void,
	target?: { type: PatternType; index: number },
): void {
	const scrollTop = listContainer.scrollTop;
	listContainer.empty();
	renderCallback();
	listContainer.scrollTop = scrollTop;
	if (target) {
		scrollTargetPatternIntoView(listContainer, target);
	}
}

function scrollTargetPatternIntoView(
	container: HTMLElement,
	target: { type: PatternType; index: number },
): void {
	const selector = `.sf-style-item[data-type="${target.type}"][data-index="${target.index}"]`;
	const targetItem = container.querySelector<HTMLElement>(selector);
	if (!targetItem) return;

	const containerRect = container.getBoundingClientRect();
	const targetRect = targetItem.getBoundingClientRect();
	if (targetRect.top < containerRect.top) {
		container.scrollTop += targetRect.top - containerRect.top;
	} else if (targetRect.bottom > containerRect.bottom) {
		container.scrollTop += targetRect.bottom - containerRect.bottom;
	}
}

interface RefreshOptions {
	refreshList?: (target?: { type: PatternType; index: number }) => void;
}

async function persistPatternsAndRefresh(
	context: SettingsTabContext,
	target?: { type: PatternType; index: number },
	options?: RefreshOptions,
): Promise<void> {
	const { plugin } = context;
	await plugin.saveSettings();
	plugin.updateCSS();
	applyPatternClasses(plugin);
	applyPatternToActiveLeaves(plugin);
	if (options?.refreshList) {
		options.refreshList(target);
	} else {
		rerenderPreservingScroll(context, target);
	}
}

async function reorderPatterns(
	context: SettingsTabContext,
	type: PatternType,
	fromIndex: number,
	toIndex: number,
	options?: RefreshOptions,
): Promise<void> {
	if (fromIndex === toIndex) return;
	const patternsArray = getPatternArray(context.plugin, type);
	if (
		!patternsArray ||
		fromIndex < 0 ||
		fromIndex >= patternsArray.length ||
		Number.isNaN(toIndex)
	) {
		return;
	}

	const moved = patternsArray.splice(fromIndex, 1)[0];
	if (!moved) return;

	const clampedIndex = Math.min(
		Math.max(toIndex, 0),
		patternsArray.length,
	);
	patternsArray.splice(clampedIndex, 0, moved);

	await persistPatternsAndRefresh(
		context,
		{ type, index: clampedIndex },
		options,
	);
}

export function renderFilesPatternsTab(context: SettingsTabContext): void {
	const { contentEl, app, plugin } = context;
	contentEl.createEl("h2", { text: "File Patterns (Regex)" });
	contentEl.createEl("p", {
		text: "Use regex patterns to style multiple files at once. Drag to reorder - first matching pattern wins.",
		cls: "sf-hint",
	});

	const addBtn = contentEl.createEl("button", {
		text: "+ Add File Pattern",
	});
	addBtn.addEventListener("click", () => {
		new PatternModal(app, plugin, "file").open();
	});

	const fileFilterValue = patternSearchFilters.file ?? "";
	const fileSearchInput = contentEl.createEl("input", {
		type: "text",
		placeholder: "Filter file patterns by name or regex...",
		cls: "sf-icon-search",
	}) as HTMLInputElement;
	fileSearchInput.value = fileFilterValue;
	fileSearchInput.setAttr(
		"aria-label",
		"Filter file patterns by name or regex",
	);

	const listEl = contentEl.createDiv("sf-styles-list sf-sortable");
	const refreshPatternList = (
		target?: { type: PatternType; index: number },
	) => {
		const filterValue = patternSearchFilters.file ?? "";
		rerenderPatternListOnly(
			listEl,
			() =>
				renderPatternList(context, listEl, "file", filterValue, {
					onReorder: async (fromIndex, toIndex) =>
						reorderPatterns(context, "file", fromIndex, toIndex, {
							refreshList: refreshPatternList,
						}),
				}),
			target,
		);
	};

	fileSearchInput.addEventListener("input", (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (!target) return;
		patternSearchFilters.file = target.value;
		refreshPatternList();
	});

	const patterns: FilePattern[] = plugin.settings.filePatterns || [];
	if (patterns.length === 0) {
		listEl.createEl("p", {
			text: "No file patterns defined. Patterns use regex to match multiple files.",
			cls: "sf-empty-message",
		});
	} else {
		refreshPatternList();
	}
}

export function renderFoldersPatternsTab(context: SettingsTabContext): void {
	const { contentEl, app, plugin } = context;
	contentEl.createEl("h2", { text: "Folder Patterns (Regex)" });
	contentEl.createEl("p", {
		text: "Use regex patterns to style multiple folders at once. Drag to reorder - first matching pattern wins.",
		cls: "sf-hint",
	});

	const addBtn = contentEl.createEl("button", {
		text: "+ Add Folder Pattern",
	});
	addBtn.addEventListener("click", () => {
		new PatternModal(app, plugin, "folder").open();
	});

	const folderFilterValue = patternSearchFilters.folder ?? "";
	const folderSearchInput = contentEl.createEl("input", {
		type: "text",
		placeholder: "Filter folder patterns by name or regex...",
		cls: "sf-icon-search",
	}) as HTMLInputElement;
	folderSearchInput.value = folderFilterValue;
	folderSearchInput.setAttr(
		"aria-label",
		"Filter folder patterns by name or regex",
	);

	const listEl = contentEl.createDiv("sf-styles-list sf-sortable");
	const refreshPatternList = (
		target?: { type: PatternType; index: number },
	) => {
		const filterValue = patternSearchFilters.folder ?? "";
		rerenderPatternListOnly(
			listEl,
			() =>
				renderPatternList(context, listEl, "folder", filterValue, {
					onReorder: async (fromIndex, toIndex) =>
						reorderPatterns(
							context,
							"folder",
							fromIndex,
							toIndex,
							{
								refreshList: refreshPatternList,
							},
						),
				}),
			target,
		);
	};

	folderSearchInput.addEventListener("input", (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (!target) return;
		patternSearchFilters.folder = target.value;
		refreshPatternList();
	});

	const patterns: FolderPattern[] = plugin.settings.folderPatterns || [];
	if (patterns.length === 0) {
		listEl.createEl("p", {
			text: "No folder patterns defined. Patterns use regex to match multiple folders.",
			cls: "sf-empty-message",
		});
	} else {
		refreshPatternList();
	}
}

export function renderPatternList(
	context: SettingsTabContext,
	listEl: HTMLElement,
	type: PatternType,
	filterText = "",
	options?: {
		onReorder?: (fromIndex: number, toIndex: number) => Promise<void>;
	},
): void {
	const { app, plugin } = context;
	const patternsArray = getPatternArray(plugin, type);
	const totalPatterns = patternsArray.length;
	const normalizedFilter = filterText.trim().toLowerCase();
	const shouldFilter = normalizedFilter.length > 0;
	let displayedCount = 0;
	const handleReorder = async (fromIndex: number, toIndex: number) => {
		if (options?.onReorder) {
			return options.onReorder(fromIndex, toIndex);
		}
		return reorderPatterns(context, type, fromIndex, toIndex);
	};
	for (let i = 0; i < totalPatterns; i++) {
		const pattern = patternsArray[i];
		if (!pattern) {
			continue;
		}
		if (shouldFilter) {
			const nameText = pattern.name?.toLowerCase() ?? "";
			const patternText = pattern.pattern.toLowerCase();
			if (
				!nameText.includes(normalizedFilter) &&
				!patternText.includes(normalizedFilter)
			) {
				continue;
			}
		}
		displayedCount++;
		const item = listEl.createDiv("sf-style-item sf-draggable");
		item.setAttribute("draggable", "true");
		item.dataset.index = i.toString();
		item.dataset.type = type;

		const header = item.createDiv("sf-style-header");
		const handle = header.createDiv("sf-drag-handle");
		handle.setText("\u22ee\u22ee");

		const iconLibrary =
			window.SFIconManager?.getIcons() ?? plugin.settings.icons ?? [];

		if (type === "file") {
			const fp = pattern as FilePattern;
			if (fp.icon) {
				renderPatternIconPreview(
					header,
					iconLibrary,
					fp.icon,
					fp.iconColor,
				);
			}
		} else {
			const folderP = pattern as FolderPattern;
			const closedIcon = folderP.iconClosed;
			const openIcon = folderP.iconOpen;
			if (closedIcon) {
				renderPatternIconPreview(
					header,
					iconLibrary,
					closedIcon,
					folderP.colorClosed,
				);
			}
			if (openIcon && openIcon !== closedIcon) {
				renderPatternIconPreview(
					header,
					iconLibrary,
					openIcon,
					folderP.colorOpen,
				);
			}
		}

		const labelDiv = header.createDiv("sf-pattern-label");
		if (type === "file") {
			const fp = pattern as FilePattern;
			if (pattern.name) {
				const nameEl = labelDiv.createEl("strong", {
					text: pattern.name,
				});
				if (fp.navColor) nameEl.style.color = fp.navColor;
				labelDiv.createEl("code", { text: pattern.pattern });
			} else {
				labelDiv.createEl("code", { text: pattern.pattern });
			}
		} else {
			const folderP = pattern as FolderPattern;
			const openColor = folderP.navColorOpen ?? folderP.navColor;
			const closedColor = folderP.navColorClosed ?? folderP.navColor;
			if (pattern.name) {
				const nameEl = labelDiv.createEl("strong", {
					text: pattern.name,
				});
				if (openColor) nameEl.style.color = openColor;
				const codeEl = labelDiv.createEl("code", {
					text: pattern.pattern,
				});
				if (closedColor && closedColor !== openColor)
					codeEl.style.color = closedColor;
			} else {
				const codeEl = labelDiv.createEl("code", {
					text: pattern.pattern,
				});
				if (openColor) codeEl.style.color = openColor;
			}
		}

		const actions = header.createDiv("sf-style-actions");
		const moveUpBtn = actions.createEl("button", {
			text: "\u2191",
			cls: "sf-move-btn",
		});
		moveUpBtn.type = "button";
		moveUpBtn.disabled = i === 0;
		moveUpBtn.setAttr("aria-label", "Move pattern up");
		moveUpBtn.addEventListener("click", async () => {
			if (i === 0) return;
			await handleReorder(i, i - 1);
		});

		const moveDownBtn = actions.createEl("button", {
			text: "\u2193",
			cls: "sf-move-btn",
		});
		moveDownBtn.type = "button";
		moveDownBtn.disabled = i === totalPatterns - 1;
		moveDownBtn.setAttr("aria-label", "Move pattern down");
		moveDownBtn.addEventListener("click", async () => {
			if (i === totalPatterns - 1) return;
			await handleReorder(i, i + 1);
		});

		const editBtn = actions.createEl("button", { text: "Edit" });
		editBtn.type = "button";
		editBtn.addEventListener("click", () => {
			new PatternModal(app, plugin, type, i).open();
		});
		const removeBtn = actions.createEl("button", {
			text: "\u00d7",
			cls: "sf-remove-btn",
		});
		removeBtn.addEventListener("click", async () => {
			const patternsArray = getPatternArray(plugin, type);
			patternsArray.splice(i, 1);
			await persistPatternsAndRefresh(context);
		});

		setupDragEvents(context, item, i, type, options);
	}

	if (shouldFilter && displayedCount === 0) {
		const emptyText =
			type === "file"
				? "No file patterns match your search."
				: "No folder patterns match your search.";
		listEl.createEl("p", {
			text: emptyText,
			cls: "sf-empty-message",
		});
	}
}

function renderPatternIconPreview(
	container: HTMLElement,
	iconLibrary: IconDefinition[],
	iconId: string,
	color?: string | null,
): void {
	const iconDef = iconLibrary.find((icon) => icon.id === iconId);
	const preview = container.createDiv("sf-icon-item-preview");
	if (iconDef) {
		if (iconDef.isColored) {
			preview.style.backgroundImage = iconDef.dataUrl || "";
			preview.style.backgroundSize =
				iconDef.backgroundSize || "contain";
		} else {
			preview.style.webkitMaskImage = iconDef.dataUrl || "";
			preview.style.maskImage = iconDef.dataUrl || "";
			preview.style.backgroundColor = color || "var(--text-normal)";
			preview.style.webkitMaskSize =
				iconDef.backgroundSize || "contain";
			preview.style.maskSize = iconDef.backgroundSize || "contain";
		}
	}
}

export function setupDragEvents(
	context: SettingsTabContext,
	item: HTMLElement,
	index: number,
	type: PatternType,
	options?: {
		onReorder?: (fromIndex: number, toIndex: number) => Promise<void>;
	},
): void {
	const handleReorder = async (fromIndex: number, toIndex: number) => {
		if (options?.onReorder) {
			return options.onReorder(fromIndex, toIndex);
		}
		return reorderPatterns(context, type, fromIndex, toIndex);
	};
	item.addEventListener("dragstart", (event: DragEvent) => {
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) return;
		dataTransfer.effectAllowed = "move";
		dataTransfer.setData("text/plain", index.toString());
		dataTransfer.setData("type", type);
		item.addClass("sf-dragging");
	});

	item.addEventListener("dragend", () => {
		item.removeClass("sf-dragging");
	});

	item.addEventListener("dragover", (event: DragEvent) => {
		event.preventDefault();
		const dataTransfer = event.dataTransfer;
		if (dataTransfer) {
			dataTransfer.dropEffect = "move";
		}
		item.addClass("sf-drag-over");
	});

	item.addEventListener("dragleave", () => {
		item.removeClass("sf-drag-over");
	});

	item.addEventListener("drop", async (event: DragEvent) => {
		event.preventDefault();
		item.removeClass("sf-drag-over");
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) return;
		const fromIndex = parseInt(dataTransfer.getData("text/plain"), 10);
		const toIndex = index;
		if (fromIndex === toIndex) return;

		await handleReorder(fromIndex, toIndex);
	});
}
