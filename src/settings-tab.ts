import { App, PluginSettingTab, setIcon } from "obsidian";
import {
	renderFilesSpecificTab,
	renderFoldersSpecificTab,
} from "./icons/settings";
import {
	renderFilesPatternsTab,
	renderFoldersPatternsTab,
} from "./patterns/settings";
import { renderColorsTab } from "./colors/settings-ui";
import type NoteIconsPlugin from "./main";

interface SettingsNavItem {
	id: string;
	label: string;
	icon?: string;
	keywords?: string[];
	children?: SettingsNavItem[];
}

function getNavStructure(): SettingsNavItem[] {
	return [
		{
			id: "colors",
			label: "Colors",
			icon: "palette",
			keywords: ["theme", "palette", "style"],
		},
		{
			id: "icons-titles",
			label: "Nav & Titles",
			icon: "image",
			keywords: ["image", "emoji", "title", "nav", "navigation"],
			children: [
				{
					id: "files",
					label: "Files",
					icon: "file",
					keywords: ["note", "document"],
					children: [
						{
							id: "files-specific",
							label: "Specific Files",
							icon: "pin",
							keywords: ["individual", "single"],
						},
						{
							id: "files-patterns",
							label: "Patterns (Regex)",
							icon: "regex",
							keywords: ["regex", "match", "wildcard"],
						},
					],
				},
				{
					id: "folders",
					label: "Folders",
					icon: "folder",
					keywords: ["directory", "path"],
					children: [
						{
							id: "folders-specific",
							label: "Specific Folders",
							icon: "pin",
							keywords: ["individual", "single"],
						},
						{
							id: "folders-patterns",
							label: "Patterns (Regex)",
							icon: "regex",
							keywords: ["regex", "match", "wildcard"],
						},
					],
				},
			],
		},
	];
}

export class NoteIconsSettingTab extends PluginSettingTab {
	plugin: NoteIconsPlugin;
	activeTab = "colors";
	contentEl!: HTMLElement;

	constructor(app: App, plugin: NoteIconsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		const isMobile = document.body.classList.contains("is-mobile");
		const navStructure = getNavStructure();

		containerEl.empty();
		containerEl.addClass("sf-settings");
		containerEl.addClass("sf-tabbed-settings");

		const layout = containerEl.createDiv("sf-settings-layout");
		let navEl: HTMLElement | undefined;
		if (!isMobile) {
			navEl = layout.createDiv("sf-settings-nav");
		}
		this.contentEl = layout.createDiv("sf-settings-content");

		if (!isMobile && navEl) {
			this.renderDesktopNav(navEl, navStructure);
		}

		this.renderContent();
	}

	renderContent() {
		if (!this.contentEl) return;
		this.contentEl.empty();
		const isMobile = document.body.classList.contains("is-mobile");

		if (this.mobileNavCleanup) {
			this.mobileNavCleanup();
			this.mobileNavCleanup = null;
		}

		if (isMobile) {
			this.mobileNavCleanup = this.renderMobileNav(
				this.contentEl,
				getNavStructure(),
			);
		}

		switch (this.activeTab) {
			case "colors":
				renderColorsTab({
					plugin: this.plugin,
					contentEl: this.contentEl,
				});
				break;
			case "files-specific":
				renderFilesSpecificTab({
					app: this.app,
					plugin: this.plugin,
					contentEl: this.contentEl,
					rerender: () => this.renderContent(),
				});
				break;
			case "files-patterns":
				renderFilesPatternsTab({
					app: this.app,
					plugin: this.plugin,
					contentEl: this.contentEl,
					rerender: () => this.renderContent(),
					scrollContainer: this.containerEl,
				});
				break;
			case "folders-specific":
				renderFoldersSpecificTab({
					app: this.app,
					plugin: this.plugin,
					contentEl: this.contentEl,
					rerender: () => this.renderContent(),
				});
				break;
			case "folders-patterns":
				renderFoldersPatternsTab({
					app: this.app,
					plugin: this.plugin,
					contentEl: this.contentEl,
					rerender: () => this.renderContent(),
					scrollContainer: this.containerEl,
				});
				break;
			default:
				renderColorsTab({
					plugin: this.plugin,
					contentEl: this.contentEl,
				});
		}
	}

	private mobileNavCleanup: (() => void) | null = null;

	private navigateToTab(tabId: string) {
		this.activeTab = tabId;

		const navEl = this.containerEl.querySelector(".sf-settings-nav");
		if (navEl) {
			navEl
				.querySelectorAll(".sf-nav-active")
				.forEach((el) => el.removeClass("sf-nav-active"));
			const target = navEl.querySelector(
				`.sf-nav-link[data-tab-id="${tabId}"]`,
			);
			if (target) {
				target.addClass("sf-nav-active");
			}
		}

		this.renderContent();
	}

	private renderDesktopNav(
		navEl: HTMLElement,
		navStructure: SettingsNavItem[],
	) {
		const searchContainer = navEl.createDiv("sf-nav-search-container");
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Search settings...",
			cls: "sf-nav-search",
		});

		const navItemsContainer = navEl.createDiv("sf-nav-items");

		const renderNavItems = (filter: string) => {
			navItemsContainer.empty();
			const filterLower = filter.toLowerCase().trim();

			navStructure.forEach((item) => {
				const shouldShow =
					filterLower === "" ||
					matchesSearch(item, filterLower);
				if (shouldShow) {
					this.renderDesktopNavItem(
						navItemsContainer,
						item,
						0,
						filterLower,
					);
				}
			});

			if (filterLower && navItemsContainer.childElementCount === 0) {
				const noResults =
					navItemsContainer.createDiv("sf-nav-no-results");
				noResults.setText("No matching settings found");
			}
		};

		searchInput.addEventListener("input", () => {
			renderNavItems(searchInput.value);
		});

		renderNavItems("");
	}

	private renderDesktopNavItem(
		parentEl: HTMLElement,
		item: SettingsNavItem,
		depth: number,
		searchFilter = "",
	) {
		const hasChildren = Boolean(item.children && item.children.length);
		const navItem = parentEl.createDiv("sf-nav-item");
		navItem.dataset.depth = depth.toString();

		const navLink = navItem.createDiv("sf-nav-link");
		navLink.dataset.depth = depth.toString();
		if (!hasChildren) {
			navLink.dataset.tabId = item.id;
		}

		if (item.icon) {
			const iconEl = navLink.createSpan({ cls: "sf-nav-icon" });
			setIcon(iconEl, item.icon);
		}
		navLink.createSpan({ text: item.label, cls: "sf-nav-label" });

		if (hasChildren) {
			const arrow = navLink.createSpan({ cls: "sf-nav-arrow" });
			arrow.setText("\u203a");
		}

		const isActive = isItemOrChildActive(item, this.activeTab);
		if (isActive && !hasChildren) {
			navLink.addClass("sf-nav-active");
		}

		if (searchFilter && matchesSearch(item, searchFilter)) {
			navLink.addClass("sf-nav-search-match");
		}

		navLink.addEventListener("click", (e) => {
			e.stopPropagation();
			if (hasChildren) {
				navItem.classList.toggle("sf-nav-expanded");
			} else {
				this.navigateToTab(item.id);
			}
		});

		if (hasChildren && item.children) {
			const childrenEl = navItem.createDiv("sf-nav-children");

			const hasMatchingChildren =
				searchFilter &&
				item.children.some((child) =>
					matchesSearch(child, searchFilter),
				);
			if (isActive || hasMatchingChildren) {
				navItem.addClass("sf-nav-expanded");
			}

			item.children.forEach((child) => {
				if (searchFilter && !matchesSearch(child, searchFilter)) {
					return;
				}

				this.renderDesktopNavItem(
					childrenEl,
					child,
					depth + 1,
					searchFilter,
				);
			});
		}
	}

	private renderMobileNav(
		layoutEl: HTMLElement,
		navStructure: SettingsNavItem[],
	): () => void {
		const nav = layoutEl.createDiv("sf-mobile-nav");

		const getAllTabs = (
			items: SettingsNavItem[],
			parent: SettingsNavItem | null = null,
		) => {
			let tabs: Array<
				SettingsNavItem & { parent?: SettingsNavItem | null }
			> = [];
			for (const item of items) {
				if (item.children && item.children.length > 0) {
					tabs = tabs.concat(getAllTabs(item.children, item));
				} else {
					tabs.push({ ...item, parent });
				}
			}
			return tabs;
		};

		const allTabs = getAllTabs(navStructure);
		const currentTab =
			allTabs.find((tab) => tab.id === this.activeTab) || allTabs[0];

		const dropdownBtn = nav.createEl("button", {
			cls: "sf-mobile-nav-dropdown",
			text: currentTab?.label || "Select",
		});

		const arrow = dropdownBtn.createSpan({ cls: "sf-mobile-nav-arrow" });
		arrow.setText("\u25be");

		const menu = nav.createDiv("sf-mobile-nav-menu");
		menu.hide();

		const grouped: Record<
			string,
			Array<SettingsNavItem & { parent?: SettingsNavItem | null }>
		> = {};
		for (const tab of allTabs) {
			const groupName = tab.parent ? tab.parent.label : "General";
			if (!grouped[groupName]) {
				grouped[groupName] = [];
			}
			grouped[groupName].push(tab);
		}

		Object.entries(grouped).forEach(([groupName, tabs]) => {
			const groupEl = menu.createDiv("sf-mobile-nav-group");
			groupEl.createDiv({
				text: groupName,
				cls: "sf-mobile-nav-group-label",
			});
			tabs.forEach((tab) => {
				const item = groupEl.createDiv({
					cls: `sf-mobile-nav-item ${tab.id === this.activeTab ? "sf-active" : ""}`,
					text: tab.label,
				});
				item.addEventListener("click", () => {
					this.navigateToTab(tab.id);
				});
			});
		});

		let menuOpen = false;
		dropdownBtn.addEventListener("click", () => {
			menuOpen = !menuOpen;
			if (menuOpen) {
				menu.show();
			} else {
				menu.hide();
			}
			dropdownBtn.classList.toggle("sf-open", menuOpen);
		});

		const clickOutsideHandler = (event: MouseEvent) => {
			const target = event.target as Node;
			if (!nav.contains(target) && menuOpen) {
				menuOpen = false;
				menu.hide();
				dropdownBtn.classList.remove("sf-open");
			}
		};
		document.addEventListener("click", clickOutsideHandler);

		return () => {
			document.removeEventListener("click", clickOutsideHandler);
		};
	}
}

function matchesSearch(
	item: SettingsNavItem,
	searchTerm: string,
): boolean {
	if (item.label.toLowerCase().includes(searchTerm)) return true;
	if (item.keywords?.some((kw) => kw.toLowerCase().includes(searchTerm)))
		return true;
	if (item.children?.some((child) => matchesSearch(child, searchTerm)))
		return true;
	return false;
}

function isItemOrChildActive(
	item: SettingsNavItem,
	activeTab: string,
): boolean {
	if (item.id === activeTab) return true;
	if (!item.children) return false;
	return item.children.some((child) =>
		isItemOrChildActive(child, activeTab),
	);
}
