import type { IconDefinition } from "./settings";

interface IconPickerGridOptions {
	container: HTMLElement;
	icons: IconDefinition[];
	selectedId: string | null;
	onChange: (id: string | null) => void;
}

interface ColorPickerGridOptions {
	container: HTMLElement;
	colors: Record<string, string>;
	selectedColor: string | null;
	onChange: (color: string | null) => void;
}

export function renderIconPickerGrid({
	container,
	icons,
	selectedId,
	onChange,
}: IconPickerGridOptions): void {
	const searchInput = container.createEl("input", {
		type: "text",
		placeholder: "Search icons...",
		cls: "sf-icon-search",
	});

	const picker = container.createDiv("sf-icon-grid");

	const renderIcons = (filter = ""): void => {
		picker.empty();
		const filterLower = filter.toLowerCase();

		const noneBtn = picker.createDiv("sf-icon-option");
		noneBtn.setText("None");
		noneBtn.addClass("sf-icon-none");
		if (!selectedId) {
			noneBtn.addClass("sf-selected");
		}
		noneBtn.addEventListener("click", () => {
			picker
				.querySelectorAll(".sf-icon-option")
				.forEach((el: Element) => el.removeClass("sf-selected"));
			noneBtn.addClass("sf-selected");
			onChange(null);
		});

		const filteredIcons = icons.filter((icon) => {
			const nameLower = icon.name?.toLowerCase() ?? "";
			return (
				!filter ||
				nameLower.includes(filterLower) ||
				icon.id.toLowerCase().includes(filterLower)
			);
		});
		filteredIcons.sort((a, b) => {
			const nameA = (a.name || a.id || "").toLowerCase();
			const nameB = (b.name || b.id || "").toLowerCase();
			return nameA.localeCompare(nameB);
		});

		for (const icon of filteredIcons) {
			const btn = picker.createDiv("sf-icon-option");
			btn.setAttribute("title", icon.name || icon.id);

			const preview = btn.createDiv("sf-icon-preview");
			if (icon.isColored) {
				preview.style.backgroundImage = icon.dataUrl;
			} else {
				preview.style.webkitMaskImage = icon.dataUrl;
				preview.style.maskImage = icon.dataUrl;
				preview.style.backgroundColor = "var(--text-normal)";
			}

			if (selectedId === icon.id) {
				btn.addClass("sf-selected");
			}

			btn.addEventListener("click", () => {
				picker
					.querySelectorAll(".sf-icon-option")
					.forEach((el: Element) => el.removeClass("sf-selected"));
				btn.addClass("sf-selected");
				onChange(icon.id);
			});
		}

		if (icons.length === 0) {
			const hint = picker.createDiv("sf-hint");
			hint.setText("No icons defined. Add icons in plugin settings.");
		} else if (filteredIcons.length === 0 && filter) {
			const hint = picker.createDiv("sf-hint");
			hint.setText("No icons match your search.");
		}
	};

	searchInput.addEventListener("input", (event: Event) => {
		const target = event.target as HTMLInputElement | null;
		if (!target) return;
		renderIcons(target.value);
	});

	renderIcons();
}

export function renderColorPickerGrid({
	container,
	colors,
	selectedColor,
	onChange,
}: ColorPickerGridOptions): void {
	const picker = container.createDiv("sf-color-grid");

	const noneBtn = picker.createDiv("sf-color-option sf-color-none");
	noneBtn.setText("\u2014");
	noneBtn.setAttribute("title", "Default");
	if (!selectedColor) {
		noneBtn.addClass("sf-selected");
	}
	noneBtn.addEventListener("click", () => {
		picker
			.querySelectorAll(".sf-color-option")
			.forEach((el: Element) => el.removeClass("sf-selected"));
		noneBtn.addClass("sf-selected");
		onChange(null);
	});

	for (const [name, color] of Object.entries(colors)) {
		const btn = picker.createDiv("sf-color-option");
		btn.style.backgroundColor = color;
		btn.setAttribute("title", name);

		if (selectedColor === color) {
			btn.addClass("sf-selected");
		}

		btn.addEventListener("click", () => {
			picker
				.querySelectorAll(".sf-color-option")
				.forEach((el: Element) => el.removeClass("sf-selected"));
			btn.addClass("sf-selected");
			onChange(color);
		});
	}
}
