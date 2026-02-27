import { Modal, Notice } from "obsidian";
import type { App } from "obsidian";
import type NoteIconsPlugin from "../main";
import type { FilePattern, FolderPattern, PatternType } from "../settings";
import {
	renderIconPickerGrid,
	renderColorPickerGrid,
} from "../ui-components";
import { applyPatternClasses, applyPatternToActiveLeaves } from "./matching";

type PatternData = (FilePattern & FolderPattern) &
	Record<string, string | null | undefined>;
type PatternKey = keyof PatternData;

export class PatternModal extends Modal {
	plugin: NoteIconsPlugin;
	type: PatternType;
	editIndex: number | null;
	patternData: PatternData;

	constructor(
		app: App,
		plugin: NoteIconsPlugin,
		type: PatternType,
		editIndex: number | null = null,
	) {
		super(app);
		this.plugin = plugin;
		this.type = type;
		this.editIndex = editIndex;

		const patterns =
			type === "file"
				? plugin.settings.filePatterns
				: plugin.settings.folderPatterns;
		const existingPattern =
			editIndex !== null ? patterns[editIndex] : undefined;

		if (existingPattern) {
			this.patternData = { ...existingPattern };
			if (
				type === "folder" &&
				this.patternData.navColor &&
				!this.patternData.navColorClosed &&
				!this.patternData.navColorOpen
			) {
				this.patternData.navColorClosed = this.patternData.navColor;
				this.patternData.navColorOpen = this.patternData.navColor;
			}
		} else if (type === "file") {
			this.patternData = {
				name: "",
				pattern: "",
				icon: null,
				iconColor: null,
				titleColor: null,
				navColor: null,
			};
		} else {
			this.patternData = {
				name: "",
				pattern: "",
				iconClosed: null,
				colorClosed: null,
				iconOpen: null,
				colorOpen: null,
				navColorClosed: null,
				navColorOpen: null,
			};
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("sf-icon-picker-modal");

		const isEdit = this.editIndex !== null;
		const isFile = this.type === "file";

		contentEl.createEl("h2", {
			text: isEdit
				? `Edit ${isFile ? "File" : "Folder"} Pattern`
				: `Add ${isFile ? "File" : "Folder"} Pattern`,
		});

		const nameRow = contentEl.createDiv("sf-form-row");
		nameRow.createEl("label", { text: "Name (optional)" });
		const nameInput = nameRow.createEl("input", {
			type: "text",
			placeholder: "e.g., Python files, Chess folders",
			value: this.patternData.name || "",
		}) as HTMLInputElement;
		nameInput.addEventListener("input", (event: Event) => {
			const target = event.target as HTMLInputElement | null;
			if (!target) return;
			this.patternData.name = target.value;
		});

		const patternRow = contentEl.createDiv("sf-form-row");
		patternRow.createEl("label", { text: "Regex Pattern" });
		const patternInput = patternRow.createEl("input", {
			type: "text",
			placeholder: "e.g., \\.py$ or /folder name/i",
			value: this.patternData.pattern,
		}) as HTMLInputElement;
		patternInput.addEventListener("input", (event: Event) => {
			const target = event.target as HTMLInputElement | null;
			if (!target) return;
			this.patternData.pattern = target.value;
		});

		patternRow.createEl("p", {
			text: "Regex pattern tested against the full path. Use /pattern/flags for options: i (case-insensitive), g (global), m (multiline), s (dotall), u (unicode)",
			cls: "sf-hint",
		});

		if (isFile) {
			this.renderIconPicker(contentEl, "Icon", "icon");
			this.renderColorPicker(contentEl, "Icon Color", "iconColor");
			this.renderColorPicker(contentEl, "Title Color", "titleColor");
			this.renderColorPicker(contentEl, "Nav Color", "navColor");
		} else {
			this.renderIconPicker(contentEl, "Closed Icon", "iconClosed");
			this.renderColorPicker(
				contentEl,
				"Closed Icon Color",
				"colorClosed",
			);
			this.renderColorPicker(
				contentEl,
				"Closed Nav Color",
				"navColorClosed",
			);
			this.renderIconPicker(contentEl, "Open Icon", "iconOpen");
			this.renderColorPicker(contentEl, "Open Icon Color", "colorOpen");
			this.renderColorPicker(
				contentEl,
				"Open Nav Color",
				"navColorOpen",
			);
		}

		const actions = contentEl.createDiv("sf-modal-actions");
		const saveBtn = actions.createEl("button", {
			text: "Save",
			cls: "mod-cta",
		});
		saveBtn.addEventListener("click", () => this.save());
		const cancelBtn = actions.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());
	}

	renderIconPicker(
		container: HTMLElement,
		label: string,
		key: PatternKey,
	): void {
		const section = container.createDiv("sf-section");
		section.createEl("h3", { text: label });
		renderIconPickerGrid({
			container: section,
			icons: this.plugin.getIconLibrary(),
			selectedId: (this.patternData[key] as string) || null,
			onChange: (id) => {
				this.patternData[key] = id;
			},
		});
	}

	renderColorPicker(
		container: HTMLElement,
		label: string,
		key: PatternKey,
	): void {
		const section = container.createDiv("sf-row");
		section.createEl("label", { text: label });
		renderColorPickerGrid({
			container: section,
			colors: this.plugin.settings.colors || {},
			selectedColor: (this.patternData[key] as string) || null,
			onChange: (color) => {
				this.patternData[key] = color;
			},
		});
	}

	async save() {
		if (!this.patternData.pattern) {
			new Notice("Pattern is required");
			return;
		}

		try {
			const match = this.patternData.pattern.match(
				/^\/(.+)\/([gimsuy]*)$/,
			);
			if (match && match[1] !== undefined) {
				new RegExp(match[1], match[2] || "");
			} else {
				new RegExp(this.patternData.pattern);
			}
		} catch (error) {
			if (error instanceof Error) {
				new Notice(`Invalid regex: ${error.message}`);
			} else {
				new Notice("Invalid regex");
			}
			return;
		}

		if (this.type === "folder") {
			delete this.patternData.navColor;
		}

		const patterns =
			this.type === "file"
				? this.plugin.settings.filePatterns
				: this.plugin.settings.folderPatterns;

		if (this.editIndex !== null) {
			patterns[this.editIndex] = this.patternData;
		} else {
			patterns.push(this.patternData);
		}

		await this.plugin.saveSettings();
		this.plugin.updateCSS();
		applyPatternClasses(this.plugin);
		applyPatternToActiveLeaves(this.plugin);
		this.close();

		if (this.plugin.settingsTab) {
			this.plugin.settingsTab.display();
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
