import { Modal } from "obsidian";
import type { App } from "obsidian";
import type NoteIconsPlugin from "../main";
import type {
	FileStyleDefinition,
	FolderStyleDefinition,
} from "../settings";
import { renderIconPickerGrid, renderColorPickerGrid } from "../ui-components";

type StyleMap = Record<string, string | null | undefined>;

export class IconPickerModal extends Modal {
	plugin: NoteIconsPlugin;
	targetPath: string;
	isFolder: boolean;
	currentStyle: StyleMap;

	constructor(
		app: App,
		plugin: NoteIconsPlugin,
		targetPath: string,
		isFolder = false,
	) {
		super(app);
		this.plugin = plugin;
		this.targetPath = targetPath;
		this.isFolder = isFolder;
		const savedStyle = isFolder
			? this.plugin.settings.folderStyles[targetPath]
			: this.plugin.settings.fileStyles[targetPath];
		this.currentStyle = { ...(savedStyle || {}) };
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("sf-icon-picker-modal");

		contentEl.createEl("h2", {
			text: this.isFolder ? "Set Folder Style" : "Set File Style",
		});
		contentEl.createEl("p", {
			text: this.targetPath,
			cls: "sf-target-path",
		});

		// Icon selection section
		this.renderIconSection(contentEl);

		// Color section
		this.renderColorSection(contentEl);

		// Actions
		const actions = contentEl.createDiv("sf-modal-actions");

		const saveBtn = actions.createEl("button", {
			text: "Save",
			cls: "mod-cta",
		});
		saveBtn.addEventListener("click", () => this.save());

		const clearBtn = actions.createEl("button", { text: "Clear Style" });
		clearBtn.addEventListener("click", () => {
			if (confirm("Clear all icon and color settings for this item?")) {
				this.clear();
			}
		});

		const cancelBtn = actions.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());
	}

	renderIconSection(container: HTMLElement) {
		const section = container.createDiv("sf-section");
		section.createEl("h3", { text: this.isFolder ? "Icons" : "Icon" });

		if (this.isFolder) {
			this.renderIconPicker(section, "Closed Icon", "iconClosed");
			this.renderIconPicker(section, "Open Icon", "iconOpen");
		} else {
			this.renderIconPicker(section, "Icon", "icon");
		}
	}

	renderIconPicker(container: HTMLElement, label: string, key: string) {
		const row = container.createDiv("sf-row");
		row.createEl("label", { text: label });
		renderIconPickerGrid({
			container: row,
			icons: this.plugin.getIconLibrary(),
			selectedId: (this.currentStyle[key] as string) || null,
			onChange: (id) => {
				this.currentStyle[key] = id;
			},
		});
	}

	renderColorSection(container: HTMLElement) {
		const section = container.createDiv("sf-section");
		section.createEl("h3", { text: "Colors" });

		if (this.isFolder) {
			this.renderColorPicker(section, "Closed Icon Color", "colorClosed");
			this.renderColorPicker(section, "Open Icon Color", "colorOpen");
			this.renderColorPicker(section, "Folder Name Color", "navColor");
		} else {
			this.renderColorPicker(section, "Icon Color", "iconColor");
			this.renderColorPicker(section, "Title Color", "titleColor");
			this.renderColorPicker(section, "Nav Color", "navColor");
		}
	}

	renderColorPicker(container: HTMLElement, label: string, key: string) {
		const row = container.createDiv("sf-row");
		row.createEl("label", { text: label });
		renderColorPickerGrid({
			container: row,
			colors: this.plugin.settings.colors || {},
			selectedColor: (this.currentStyle[key] as string) || null,
			onChange: (color) => {
				this.currentStyle[key] = color;
			},
		});
	}

	async save() {
		const hasInlineStyles =
			this.currentStyle.icon || this.currentStyle.titleColor;

		if (this.isFolder) {
			if (Object.values(this.currentStyle).some((v) => v)) {
				this.plugin.settings.folderStyles[this.targetPath] = this
					.currentStyle as FolderStyleDefinition;
			} else {
				delete this.plugin.settings.folderStyles[this.targetPath];
			}
		} else {
			if (Object.values(this.currentStyle).some((v) => v)) {
				this.plugin.settings.fileStyles[this.targetPath] = this
					.currentStyle as FileStyleDefinition;
				if (hasInlineStyles) {
					await this.plugin.addCssClassToFile(this.targetPath);
				}
			} else {
				delete this.plugin.settings.fileStyles[this.targetPath];
				await this.plugin.removeCssClassFromFile(this.targetPath);
			}
		}

		await this.plugin.saveSettings();
		this.plugin.updateCSS();
		this.close();
	}

	async clear() {
		if (this.isFolder) {
			delete this.plugin.settings.folderStyles[this.targetPath];
		} else {
			delete this.plugin.settings.fileStyles[this.targetPath];
			await this.plugin.removeCssClassFromFile(this.targetPath);
		}

		await this.plugin.saveSettings();
		this.plugin.updateCSS();
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
