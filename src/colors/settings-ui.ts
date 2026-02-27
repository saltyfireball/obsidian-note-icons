import { Notice, Setting } from "obsidian";
import type NoteIconsPlugin from "../main";
// isHexColor available in helpers if needed

import type { ColorMap } from "../settings";

interface RenderColorsTabArgs {
	plugin: NoteIconsPlugin;
	contentEl: HTMLElement;
}

export function renderColorsTab({
	plugin,
	contentEl,
}: RenderColorsTabArgs): void {
	const existingSection = contentEl.querySelector(".sf-colors-section");
	if (existingSection) {
		existingSection.remove();
	}

	const section = contentEl.createDiv("sf-colors-section");
	new Setting(section).setName("Color palette").setHeading();
	section.createEl("p", {
		text: "Define colors that can be used for icons and text throughout the plugin.",
		cls: "sf-hint",
	});

	const addColorRow = section.createDiv("sf-add-color-row");
	const colorNameInput = addColorRow.createEl("input", {
		type: "text",
		placeholder: "Color name",
		cls: "sf-color-name-input",
	});
	const colorValueInput = addColorRow.createEl("input", {
		type: "color",
		value: "#ff6188",
		cls: "sf-color-value-input",
	});
	const colorPreview = addColorRow.createDiv("sf-color-preview");
	const colorValueText = addColorRow.createEl("input", {
		type: "text",
		placeholder: "#hex, #hexaa, rgb/rgba",
		cls: "sf-color-text-input-small",
	});
	const opacityWrap = addColorRow.createDiv("sf-color-opacity");
	opacityWrap.createEl("span", {
		text: "Opacity",
		cls: "sf-color-opacity-label",
	});
	const opacityInput = opacityWrap.createEl("input", {
		type: "range",
		cls: "sf-color-opacity-input",
		attr: {
			min: "0",
			max: "100",
			value: "100",
		},
	});
	const opacityValue = opacityWrap.createEl("span", {
		text: "100%",
		cls: "sf-color-opacity-value",
	});
	const addColorBtn = addColorRow.createEl("button", {
		text: "+ add color",
	});

	const colorStorage: ColorMap = plugin.settings.colors;
	addColorBtn.addEventListener("click", () => {
		const name = colorNameInput.value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-");
		if (!name) {
			new Notice("Color name is required");
			return;
		}
		if (colorStorage[name]) {
			new Notice("Color with this name already exists");
			return;
		}
		const colorValue =
			colorValueText.value.trim() || colorValueInput.value;
		colorStorage[name] = colorValue;
		void plugin.saveSettings().then(() => {
			renderColorsTab({ plugin, contentEl });
		});
	});

	const updatePreview = (value: string) => {
		const trimmed = value.trim();
		colorPreview.style.backgroundColor =
			trimmed || colorValueInput.value;
	};

	const updateTextFromPicker = () => {
		const alpha = Number(opacityInput.value);
		opacityValue.textContent = `${alpha}%`;
		const baseHex = colorValueInput.value;
		if (alpha >= 100) {
			colorValueText.value = baseHex;
			updatePreview(baseHex);
			return;
		}
		const alphaHex = toHex(Math.round((alpha / 100) * 255));
		const composed = `${baseHex}${alphaHex}`;
		colorValueText.value = composed;
		updatePreview(composed);
	};

	colorValueInput.addEventListener("input", () => {
		updateTextFromPicker();
	});

	opacityInput.addEventListener("input", () => {
		updateTextFromPicker();
	});

	colorValueText.addEventListener("input", (event) => {
		const target = event.target as HTMLInputElement;
		const value = target.value.trim();
		const pickerValue = resolveColorPickerValue(value);
		if (pickerValue) {
			colorValueInput.value = pickerValue;
		}
		const alphaPercent = extractAlphaPercent(value);
		if (alphaPercent !== null) {
			opacityInput.value = `${alphaPercent}`;
			opacityValue.textContent = `${alphaPercent}%`;
		}
		updatePreview(value);
	});

	updatePreview("");

	const colorsList = section.createDiv("sf-colors-list");
	Object.entries(colorStorage).forEach(([name, color]) => {
		const item = colorsList.createDiv("sf-color-item");

		const swatch = item.createDiv("sf-color-swatch");
		swatch.style.backgroundColor = color;

		item.createEl("span", { text: name });

		const input = item.createEl("input", {
			type: "text",
			value: color,
		});
		input.addEventListener("change", (event) => {
			const target = event.target as HTMLInputElement;
			colorStorage[name] = target.value;
			swatch.style.backgroundColor = target.value;
			void plugin.saveSettings().then(() => {
				plugin.updateCSS();
			});
		});

		const removeBtn = item.createEl("button", {
			text: "\u00d7",
			cls: "sf-remove-btn",
		});
		removeBtn.addEventListener("click", () => {
			delete colorStorage[name];
			void plugin.saveSettings().then(() => {
				renderColorsTab({ plugin, contentEl });
			});
		});
	});
}

function resolveColorPickerValue(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const hex = trimmed.replace(/^#/, "");
	if (/^[0-9a-fA-F]{6}$/.test(hex)) {
		return `#${hex}`;
	}
	if (/^[0-9a-fA-F]{8}$/.test(hex)) {
		return `#${hex.slice(0, 6)}`;
	}
	if (/^[0-9a-fA-F]{3}$/.test(hex)) {
		return `#${hex
			.split("")
			.map((char) => `${char}${char}`)
			.join("")}`;
	}
	if (/^[0-9a-fA-F]{4}$/.test(hex)) {
		const rgb = hex
			.slice(0, 3)
			.split("")
			.map((char) => `${char}${char}`)
			.join("");
		return `#${rgb}`;
	}
	const rgbaMatch = trimmed.match(
		/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
	);
	if (rgbaMatch) {
		const r = clampChannel(rgbaMatch[1]);
		const g = clampChannel(rgbaMatch[2]);
		const b = clampChannel(rgbaMatch[3]);
		if (r === null || g === null || b === null) {
			return null;
		}
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	return null;
}

function extractAlphaPercent(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const hex = trimmed.replace(/^#/, "");
	if (/^[0-9a-fA-F]{8}$/.test(hex)) {
		const alpha = parseInt(hex.slice(6, 8), 16) / 255;
		return Math.round(alpha * 100);
	}
	if (/^[0-9a-fA-F]{4}$/.test(hex)) {
		const alpha = parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
		return Math.round(alpha * 100);
	}
	const rgbaMatch = trimmed.match(
		/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i,
	);
	if (rgbaMatch) {
		const alphaValue = rgbaMatch[4];
		if (!alphaValue) return null;
		const alpha = Number.parseFloat(alphaValue);
		if (Number.isNaN(alpha)) return null;
		return Math.round(Math.min(1, Math.max(0, alpha)) * 100);
	}
	return 100;
}

function clampChannel(value?: string): number | null {
	if (value === undefined) return null;
	const parsed = Number.parseFloat(value);
	if (Number.isNaN(parsed)) return null;
	return Math.min(255, Math.max(0, Math.round(parsed)));
}

function toHex(value: number): string {
	return value.toString(16).padStart(2, "0");
}
