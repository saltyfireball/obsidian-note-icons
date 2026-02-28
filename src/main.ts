import {
	MarkdownView,
	Plugin,
	TFile,
} from "obsidian";
import {
	DEFAULT_SETTINGS,
} from "./settings";
import type { IconDefinition, NoteIconsSettings } from "./settings";
import { NoteIconsSettingTab } from "./settings-tab";
import { CSSGenerator } from "./css-generator";
import {
	normalizeFontSize,
	escapeAttributeValue,
	deepMerge,
} from "./helpers";
import { createManagedStyleEl } from "./style-manager";
import {
	registerPatterns,
	applyPatternClasses,
} from "./patterns/register";
import { registerIcons } from "./icons/register";

declare global {
	interface Window {
		SFIconManager?: {
			getIcons(): IconDefinition[];
			getIconById(id: string): IconDefinition | null;
			onIconsChanged(callback: () => void): () => void;
		};
	}
}

export default class NoteIconsPlugin extends Plugin {
	styleEl?: HTMLStyleElement;
	settingsTab?: NoteIconsSettingTab;
	settings!: NoteIconsSettings;
	private _cssGenerator: CSSGenerator | null = null;
	private _iconManagerUnsubscribe: (() => void) | null = null;

	async onload() {
		await this.loadSettings();

		// Inject CSS for icons/styles
		this.styleEl = createManagedStyleEl("note-icons-styles");
		this.updateCSS();

		// Setup pattern matching observer for file explorer
		registerPatterns(this);

		// Add settings tab
		this.settingsTab = new NoteIconsSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);

		// Register icon file-menu and command
		registerIcons(this);

		// Subscribe to Icon Manager changes if available
		if (window.SFIconManager) {
			this._iconManagerUnsubscribe = window.SFIconManager.onIconsChanged(
				() => {
					this.invalidateCssGenerator();
					this.updateCSS();
				},
			);
		}
	}

	onunload() {
		if (this._iconManagerUnsubscribe) {
			this._iconManagerUnsubscribe();
			this._iconManagerUnsubscribe = null;
		}
		if (this.styleEl) {
			this.styleEl.remove();
		}
	}

	refreshActiveMarkdownPreview() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || !view.previewMode) return;
		if (view.getMode && view.getMode() !== "preview") return;
		if (typeof view.previewMode.rerender === "function") {
			view.previewMode.rerender(true);
		}
	}

	refreshAllFeatures(): void {
		this.updateCSS();
		applyPatternClasses(this);
	}

	async loadSettings() {
		const savedData = (await this.loadData()) as Partial<NoteIconsSettings> | null;
		this.settings = deepMerge(DEFAULT_SETTINGS, (savedData ?? {}) as Record<string, unknown>);
	}

	async saveSettings() {
		this.invalidateCssGenerator();
		await this.saveData(this.settings);
	}

	// Get icons from Icon Manager API, falling back to local settings
	getIconLibrary(): IconDefinition[] {
		return window.SFIconManager?.getIcons() ?? this.settings.icons;
	}

	private getCssGenerator(): CSSGenerator {
		if (!this._cssGenerator) {
			this._cssGenerator = new CSSGenerator(this.settings, {
				normalizeFontSize,
				escapeAttributeValue,
			});
		}
		return this._cssGenerator;
	}

	invalidateCssGenerator(): void {
		this._cssGenerator = null;
	}

	updateCSS() {
		const css = this.getCssGenerator().generate();
		if (this.styleEl) {
			this.styleEl.textContent = css;
		}
	}

	getCssClassForPath(path: string) {
		return this.getCssGenerator().pathToCssClass(path);
	}

	async addCssClassToFile(path: string) {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;

		const cssClass = this.getCssClassForPath(path);

		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			if (!frontmatter.cssclasses) {
				frontmatter.cssclasses = [];
			}
			if (!Array.isArray(frontmatter.cssclasses)) {
				frontmatter.cssclasses = [frontmatter.cssclasses];
			}
			if (!(frontmatter.cssclasses as string[]).includes(cssClass)) {
				(frontmatter.cssclasses as string[]).push(cssClass);
			}
		});
	}

	async removeCssClassFromFile(path: string) {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;

		const cssClass = this.getCssClassForPath(path);

		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			if (frontmatter.cssclasses) {
				if (Array.isArray(frontmatter.cssclasses)) {
					frontmatter.cssclasses = (frontmatter.cssclasses as string[]).filter(
						(c: string) => c !== cssClass,
					);
					if ((frontmatter.cssclasses as string[]).length === 0) {
						delete frontmatter.cssclasses;
					}
				} else if (frontmatter.cssclasses === cssClass) {
					delete frontmatter.cssclasses;
				}
			}
		});
	}
}
