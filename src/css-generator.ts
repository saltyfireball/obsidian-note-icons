import type { NoteIconsSettings } from "./settings";
import { sanitizeCssValue } from "./helpers";

export interface CSSGeneratorHelpers {
	normalizeFontSize: (value?: string) => string;
	escapeAttributeValue: (value?: string) => string;
}

type CSSStyle = Record<string, any>;
type CSSPattern = Record<string, any>;
type CSSGeneratorSettings = Omit<
	NoteIconsSettings,
	"icons" | "filePatterns" | "folderPatterns" | "fileStyles" | "folderStyles"
> & {
	icons: Array<Record<string, any>>;
	filePatterns: CSSPattern[];
	folderPatterns: CSSPattern[];
	fileStyles: Record<string, CSSStyle>;
	folderStyles: Record<string, CSSStyle>;
};

export class CSSGenerator {
	constructor(
		public settings: CSSGeneratorSettings,
		private helpers: CSSGeneratorHelpers,
	) {}

	private getIcons(): Array<Record<string, any>> {
		if (typeof window !== "undefined" && window.SFIconManager) {
			return window.SFIconManager.getIcons() as Array<Record<string, any>>;
		}
		return this.settings.icons;
	}

	normalizeBgSize(value?: string | number | null): string {
		const normalized =
			value !== null && value !== undefined ? value.toString().trim() : "";
		if (!normalized) return "contain";
		if (/^\d+$/.test(normalized)) {
			return `${normalized}%`;
		}
		return normalized;
	}

	normalizeBorderRadius(value?: string | number | null): string {
		const normalized =
			value !== null && value !== undefined ? value.toString().trim() : "";
		if (!normalized) return "";
		if (/^\d+$/.test(normalized)) {
			return `${normalized}px`;
		}
		return normalized;
	}

	pathToCssClass(path: string): string {
		let hash = 0;
		for (let i = 0; i < path.length; i++) {
			const char = path.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return `sf-file-${Math.abs(hash).toString(36)}`;
	}

	generate(): string {
		const lines = [];

		if (typeof window === "undefined" || !window.SFIconManager) {
			lines.push(":root {");
			for (const icon of this.settings.icons) {
				lines.push(`  --sf-icon-${icon.id}: ${icon.dataUrl};`);
			}
			lines.push("}");
			lines.push("");
		}

		lines.push(`
/* NoteIcons - Base nav icon styles */
.sf-has-icon .nav-file-title-content::before,
.sf-has-icon .nav-folder-title-content::before {
  content: "";
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  margin-right: 6px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
`);

		for (let i = 0; i < (this.settings.filePatterns || []).length; i++) {
			const pattern = this.settings.filePatterns[i]!;
			lines.push(this.generateFilePatternCSS(i, pattern));
		}

		for (let i = 0; i < (this.settings.folderPatterns || []).length; i++) {
			const pattern = this.settings.folderPatterns[i]!;
			lines.push(this.generateFolderPatternCSS(i, pattern));
		}

		for (const [path, style] of Object.entries(this.settings.fileStyles)) {
			lines.push(this.generateFileCSS(path, style));
		}

		for (const [path, style] of Object.entries(this.settings.folderStyles)) {
			lines.push(this.generateFolderCSS(path, style));
		}

		return lines.join("\n");
	}

	generateFileCSS(path: string, style: CSSStyle): string {
		const lines = [];
		const escapedPath = path.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		const icon = this.getIcons().find((i) => i.id === style.icon);

		if (style.icon && icon) {
			const bgSize = this.normalizeBgSize(icon.backgroundSize);

			if (icon.isColored) {
				lines.push(`
/* File: ${path} */
div.nav-file-title[data-path="${escapedPath}"] .nav-file-title-content::before {
  content: "";
  display: inline-flex;
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-right: 6px;
  vertical-align: middle;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${style.icon});
  background-size: ${bgSize} !important;
  background-repeat: no-repeat;
  background-position: center;
  ${
		icon.borderRadius
			? `border-radius: ${this.normalizeBorderRadius(icon.borderRadius)} !important;`
			: ""
	}
  ${icon.borderRadius ? "overflow: hidden !important;" : ""}
}
`);
			} else {
				const color =
					sanitizeCssValue(style.iconColor) || "var(--text-normal)";
				lines.push(`
/* File: ${path} */
div.nav-file-title[data-path="${escapedPath}"] .nav-file-title-content::before {
  content: "";
  display: inline-flex;
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-right: 6px;
  vertical-align: middle;
  -webkit-mask-image: var(--sf-icon-${style.icon});
  mask-image: var(--sf-icon-${style.icon});
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: ${color};
}
`);
			}
		}

		if (style.navColor) {
			lines.push(`
div.nav-file-title[data-path="${escapedPath}"] .nav-file-title-content {
  color: ${sanitizeCssValue(style.navColor)};
}
`);
		}

		const cssClass = this.pathToCssClass(path);

		if (style.icon && icon) {
			const bgSize = this.normalizeBgSize(icon.backgroundSize);

			if (icon.isColored) {
				lines.push(`
/* Inline title icon for: ${path} */
.${cssClass} .inline-title::before {
  content: "";
  display: inline-flex;
  width: 1.25em;
  height: 1.25em;
  margin-right: 10px;
  vertical-align: middle;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${style.icon});
  background-size: ${bgSize} !important;
  background-repeat: no-repeat;
  background-position: center;
  ${
		icon.borderRadius
			? `border-radius: ${this.normalizeBorderRadius(icon.borderRadius)} !important;`
			: ""
	}
  ${icon.borderRadius ? "overflow: hidden !important;" : ""}
}
`);
			} else {
				const color =
					sanitizeCssValue(style.iconColor) || "var(--text-normal)";
				lines.push(`
/* Inline title icon for: ${path} */
.${cssClass} .inline-title::before {
  content: "";
  display: inline-flex;
  width: 1.25em;
  height: 1.25em;
  margin-right: 10px;
  vertical-align: middle;
  -webkit-mask-image: var(--sf-icon-${style.icon});
  mask-image: var(--sf-icon-${style.icon});
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: ${color};
}
`);
			}
		}

		if (style.titleColor) {
			lines.push(`
.${cssClass} .inline-title {
  color: ${sanitizeCssValue(style.titleColor)};
}
`);
		}

		return lines.join("\n");
	}

	generateFolderCSS(path: string, style: CSSStyle): string {
		const lines = [];
		const escapedPath = path.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		const iconClosed = this.getIcons().find(
			(i) => i.id === style.iconClosed,
		);
		const iconOpen = this.getIcons().find((i) => i.id === style.iconOpen);

		if (style.iconClosed && iconClosed) {
			const color =
				sanitizeCssValue(style.colorClosed) || "var(--text-faint)";
			const bgSize = this.normalizeBgSize(iconClosed.backgroundSize);

			if (iconClosed.isColored) {
				lines.push(`
/* Folder closed: ${path} */
.nav-folder.is-collapsed > div.nav-folder-title[data-path="${escapedPath}"] .nav-folder-title-content::before {
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${style.iconClosed});
  background-size: ${bgSize} !important;
  ${
		iconClosed.borderRadius
			? `border-radius: ${this.normalizeBorderRadius(iconClosed.borderRadius)} !important;`
			: ""
	}
  ${iconClosed.borderRadius ? "overflow: hidden !important;" : ""}
}
`);
			} else {
				lines.push(`
/* Folder closed: ${path} */
.nav-folder.is-collapsed > div.nav-folder-title[data-path="${escapedPath}"] .nav-folder-title-content::before {
  -webkit-mask-image: var(--sf-icon-${style.iconClosed});
  mask-image: var(--sf-icon-${style.iconClosed});
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: ${color};
}
`);
			}
		}

		if (style.iconOpen && iconOpen) {
			const color =
				sanitizeCssValue(style.colorOpen) || "var(--text-accent)";
			const bgSize = this.normalizeBgSize(iconOpen.backgroundSize);

			if (iconOpen.isColored) {
				lines.push(`
/* Folder open: ${path} */
.nav-folder:not(.is-collapsed) > div.nav-folder-title[data-path="${escapedPath}"] .nav-folder-title-content::before {
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${style.iconOpen});
  background-size: ${bgSize} !important;
  ${
		iconOpen.borderRadius
			? `border-radius: ${this.normalizeBorderRadius(iconOpen.borderRadius)} !important;`
			: ""
	}
  ${iconOpen.borderRadius ? "overflow: hidden !important;" : ""}
}
`);
			} else {
				lines.push(`
/* Folder open: ${path} */
.nav-folder:not(.is-collapsed) > div.nav-folder-title[data-path="${escapedPath}"] .nav-folder-title-content::before {
  -webkit-mask-image: var(--sf-icon-${style.iconOpen});
  mask-image: var(--sf-icon-${style.iconOpen});
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: ${color};
}
`);
			}
		}

		if (style.navColor) {
			lines.push(`
div.nav-folder-title[data-path="${escapedPath}"] .nav-folder-title-content {
  color: ${sanitizeCssValue(style.navColor)};
}
`);
		}

		return lines.join("\n");
	}

	generateFilePatternCSS(index: number, pattern: CSSPattern): string {
		const lines = [];
		const className = `sf-pattern-file-${index}`;
		const icon = this.getIcons().find((i) => i.id === pattern.icon);

		if (pattern.icon && icon) {
			const bgSize = this.normalizeBgSize(icon.backgroundSize);

			if (icon.isColored) {
				lines.push(`
/* File Pattern: ${pattern.pattern} */
.${className} .nav-file-title-content::before {
  content: "";
  display: inline-flex;
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-right: 6px;
  vertical-align: middle;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${pattern.icon});
  background-size: ${bgSize} !important;
  background-repeat: no-repeat;
  background-position: center;
  ${
		icon.borderRadius
			? `border-radius: ${this.normalizeBorderRadius(icon.borderRadius)} !important;`
			: ""
	}
  ${icon.borderRadius ? "overflow: hidden !important;" : ""}
}
`);
			} else {
				const color =
					sanitizeCssValue(pattern.iconColor) || "var(--text-normal)";
				lines.push(`
/* File Pattern: ${pattern.pattern} */
.${className} .nav-file-title-content::before {
  content: "";
  display: inline-flex;
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-right: 6px;
  vertical-align: middle;
  -webkit-mask-image: var(--sf-icon-${pattern.icon});
  mask-image: var(--sf-icon-${pattern.icon});
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: ${color};
}
`);
			}
		}

		if (pattern.navColor) {
			lines.push(`
.${className} .nav-file-title-content {
  color: ${sanitizeCssValue(pattern.navColor)};
}
`);
		}

		if (pattern.icon && icon) {
			const bgSize = this.normalizeBgSize(icon.backgroundSize);

			if (icon.isColored) {
				lines.push(`
.${className} .inline-title::before {
  content: "";
  display: inline-flex;
  width: 1.25em;
  height: 1.25em;
  margin-right: 10px;
  vertical-align: middle;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${pattern.icon});
  background-size: ${bgSize} !important;
  background-repeat: no-repeat;
  background-position: center;
  ${
		icon.borderRadius
			? `border-radius: ${this.normalizeBorderRadius(icon.borderRadius)} !important;`
			: ""
	}
  ${icon.borderRadius ? "overflow: hidden !important;" : ""}
}
`);
			} else {
				const color =
					sanitizeCssValue(pattern.iconColor) || "var(--text-normal)";
				lines.push(`
.${className} .inline-title::before {
  content: "";
  display: inline-flex;
  width: 1.25em;
  height: 1.25em;
  margin-right: 10px;
  vertical-align: middle;
  -webkit-mask-image: var(--sf-icon-${pattern.icon});
  mask-image: var(--sf-icon-${pattern.icon});
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: ${color};
}
`);
			}
		}

		if (pattern.titleColor) {
			lines.push(`
.${className} .inline-title {
  color: ${sanitizeCssValue(pattern.titleColor)};
}
`);
		}

		return lines.join("\n");
	}

	generateFolderPatternCSS(index: number, pattern: CSSPattern): string {
		const lines = [];
		const className = `sf-pattern-folder-${index}`;
		const iconClosed = this.getIcons().find(
			(i) => i.id === pattern.iconClosed,
		);
		const iconOpen = this.getIcons().find((i) => i.id === pattern.iconOpen);

		if (pattern.iconClosed && iconClosed) {
			const color =
				sanitizeCssValue(pattern.colorClosed) || "var(--text-faint)";
			const bgSize = this.normalizeBgSize(iconClosed.backgroundSize);
			const borderRadius = iconClosed.borderRadius
				? `border-radius: ${this.normalizeBorderRadius(iconClosed.borderRadius)} !important;`
				: "";
			const overflow =
				iconClosed.isColored && iconClosed.borderRadius
					? "overflow: hidden !important;"
					: "";

			if (iconClosed.isColored) {
				lines.push(`
/* Folder Pattern closed: ${pattern.pattern} */
.nav-folder.${className}.is-collapsed > .nav-folder-title .nav-folder-title-content::before {
  content: "" !important;
  display: inline-flex !important;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  margin-right: 6px !important;
  flex-shrink: 0 !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${pattern.iconClosed}) !important;
  background-size: ${bgSize} !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  ${borderRadius}
  ${overflow}
}
`);
			} else {
				lines.push(`
/* Folder Pattern closed: ${pattern.pattern} */
.nav-folder.${className}.is-collapsed > .nav-folder-title .nav-folder-title-content::before {
  content: "" !important;
  display: inline-flex !important;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  margin-right: 6px !important;
  flex-shrink: 0 !important;
  -webkit-mask-image: var(--sf-icon-${pattern.iconClosed}) !important;
  mask-image: var(--sf-icon-${pattern.iconClosed}) !important;
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat !important;
  mask-repeat: no-repeat !important;
  -webkit-mask-position: center !important;
  mask-position: center !important;
  background-color: ${color} !important;
  ${borderRadius}
}
`);
			}
		}

		if (pattern.iconOpen && iconOpen) {
			const color =
				sanitizeCssValue(pattern.colorOpen) || "var(--text-accent)";
			const bgSize = this.normalizeBgSize(iconOpen.backgroundSize);
			const borderRadius = iconOpen.borderRadius
				? `border-radius: ${this.normalizeBorderRadius(iconOpen.borderRadius)} !important;`
				: "";
			const overflow =
				iconOpen.isColored && iconOpen.borderRadius
					? "overflow: hidden !important;"
					: "";

			if (iconOpen.isColored) {
				lines.push(`
/* Folder Pattern open: ${pattern.pattern} */
.nav-folder.${className}:not(.is-collapsed) > .nav-folder-title .nav-folder-title-content::before {
  content: "" !important;
  display: inline-flex !important;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  margin-right: 6px !important;
  flex-shrink: 0 !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
  background-color: transparent !important;
  background-image: var(--sf-icon-${pattern.iconOpen}) !important;
  background-size: ${bgSize} !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  ${borderRadius}
  ${overflow}
}
`);
			} else {
				lines.push(`
/* Folder Pattern open: ${pattern.pattern} */
.nav-folder.${className}:not(.is-collapsed) > .nav-folder-title .nav-folder-title-content::before {
  content: "" !important;
  display: inline-flex !important;
  width: 18px !important;
  height: 18px !important;
  min-width: 18px !important;
  margin-right: 6px !important;
  flex-shrink: 0 !important;
  -webkit-mask-image: var(--sf-icon-${pattern.iconOpen}) !important;
  mask-image: var(--sf-icon-${pattern.iconOpen}) !important;
  -webkit-mask-size: ${bgSize} !important;
  mask-size: ${bgSize} !important;
  -webkit-mask-repeat: no-repeat !important;
  mask-repeat: no-repeat !important;
  -webkit-mask-position: center !important;
  mask-position: center !important;
  background-color: ${color} !important;
  ${borderRadius}
}
`);
			}
		}

		if (pattern.navColorClosed) {
			lines.push(`
.nav-folder.${className}.is-collapsed > .nav-folder-title .nav-folder-title-content {
  color: ${sanitizeCssValue(pattern.navColorClosed)};
}
`);
		}

		if (pattern.navColorOpen) {
			lines.push(`
.nav-folder.${className}:not(.is-collapsed) > .nav-folder-title .nav-folder-title-content {
  color: ${sanitizeCssValue(pattern.navColorOpen)};
}
`);
		}

		if (
			pattern.navColor &&
			!pattern.navColorClosed &&
			!pattern.navColorOpen
		) {
			lines.push(`
.nav-folder.${className} > .nav-folder-title .nav-folder-title-content {
  color: ${sanitizeCssValue(pattern.navColor)};
}
`);
		}

		return lines.join("\n");
	}
}
