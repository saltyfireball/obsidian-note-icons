import { Setting } from "obsidian";
import type { App } from "obsidian";
import type NoteIconsPlugin from "../main";

interface SettingsTabContext {
	app: App;
	plugin: NoteIconsPlugin;
	contentEl: HTMLElement;
	rerender: () => void;
}

export function renderFilesSpecificTab(context: SettingsTabContext) {
	const { contentEl, plugin, rerender } = context;
	new Setting(contentEl).setName("Specific file styles").setHeading();
	contentEl.createEl("p", {
		text: "Styles applied to individual files. Right-click a file in the explorer to set its style.",
		cls: "sf-hint",
	});

	const fileStylesList = contentEl.createDiv("sf-styles-list");
	const fileStyles = Object.entries(plugin.settings.fileStyles);

	if (fileStyles.length === 0) {
		fileStylesList.createEl("p", {
			text: "No file styles defined. Right-click a file in the explorer to set its style.",
			cls: "sf-empty-message",
		});
	} else {
		for (const [path, style] of fileStyles) {
			const item = fileStylesList.createDiv("sf-style-item");

			const header = item.createDiv("sf-style-header");
			header.createEl("code", { text: path });

			const actions = header.createDiv("sf-style-actions");
			const removeBtn = actions.createEl("button", {
				text: "\u00d7",
				cls: "sf-remove-btn",
			});
			removeBtn.addEventListener("click", async () => {
				delete plugin.settings.fileStyles[path];
				await plugin.saveSettings();
				plugin.updateCSS();
				rerender();
			});
		}
	}
}

export function renderFoldersSpecificTab(context: SettingsTabContext) {
	const { contentEl, plugin, rerender } = context;
	new Setting(contentEl).setName("Specific folder styles").setHeading();
	contentEl.createEl("p", {
		text: "Styles applied to individual folders. Right-click a folder in the explorer to set its style.",
		cls: "sf-hint",
	});

	const folderStylesList = contentEl.createDiv("sf-styles-list");
	const folderStyles = Object.entries(plugin.settings.folderStyles);

	if (folderStyles.length === 0) {
		folderStylesList.createEl("p", {
			text: "No folder styles defined. Right-click a folder in the explorer to set its style.",
			cls: "sf-empty-message",
		});
	} else {
		for (const [path, style] of folderStyles) {
			const item = folderStylesList.createDiv("sf-style-item");

			const header = item.createDiv("sf-style-header");
			header.createEl("code", { text: path });

			const actions = header.createDiv("sf-style-actions");
			const removeBtn = actions.createEl("button", {
				text: "\u00d7",
				cls: "sf-remove-btn",
			});
			removeBtn.addEventListener("click", async () => {
				delete plugin.settings.folderStyles[path];
				await plugin.saveSettings();
				plugin.updateCSS();
				rerender();
			});
		}
	}
}
