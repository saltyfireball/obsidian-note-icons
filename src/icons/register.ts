import { TFolder } from "obsidian";
import type NoteIconsPlugin from "../main";
import { IconPickerModal } from "./modals";

/**
 * Register the icons feature on the plugin.
 * Registers the file-menu "Set Icon & Colors" handler and
 * the "Set Icon & Colors for Current File" command.
 */
export function registerIcons(plugin: NoteIconsPlugin): void {
	// Register file menu event
	plugin.registerEvent(
		plugin.app.workspace.on("file-menu", (menu, file) => {
			const isFolder = file instanceof TFolder;

			menu.addItem((item) => {
				item.setTitle("Set Icon & Colors")
					.setIcon("palette")
					.onClick(() => {
						new IconPickerModal(
							plugin.app,
							plugin,
							file.path,
							isFolder,
						).open();
					});
			});
		}),
	);

	// Register command for current file
	plugin.addCommand({
		id: "set-icon-current-file",
		name: "Set Icon & Colors for Current File",
		checkCallback: (checking) => {
			const file = plugin.app.workspace.getActiveFile();
			if (file) {
				if (!checking) {
					new IconPickerModal(
						plugin.app,
						plugin,
						file.path,
						false,
					).open();
				}
				return true;
			}
			return false;
		},
	});
}
