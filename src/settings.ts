export interface IconDefinition {
	id: string;
	name?: string;
	dataUrl: string;
	isColored?: boolean;
	backgroundSize?: string;
	borderRadius?: string;
}

export interface FileStyleDefinition {
	icon?: string | null;
	iconColor?: string | null;
	titleColor?: string | null;
	navColor?: string | null;
}

export interface FolderStyleDefinition {
	iconClosed?: string | null;
	colorClosed?: string | null;
	iconOpen?: string | null;
	colorOpen?: string | null;
	navColor?: string | null;
}

export interface FilePattern {
	name?: string;
	pattern: string;
	icon?: string | null;
	iconColor?: string | null;
	titleColor?: string | null;
	navColor?: string | null;
}

export interface FolderPattern {
	name?: string;
	pattern: string;
	iconClosed?: string | null;
	colorClosed?: string | null;
	iconOpen?: string | null;
	colorOpen?: string | null;
	navColor?: string | null;
	navColorClosed?: string | null;
	navColorOpen?: string | null;
}

export type PatternType = "file" | "folder";

export type ColorMap = Record<string, string>;

const DEFAULT_COLORS: ColorMap = {
	red: "#e06060",
	orange: "#fc9867",
	yellow: "#ffd866",
	green: "#a9dc76",
	cyan: "#78dce8",
	blue: "#6796e6",
	purple: "#ab9df2",
	pink: "#ff6188",
	gray: "#939293",
	white: "#fcfcfa",
};

export const DEFAULT_SETTINGS = {
	icons: [] as IconDefinition[],
	fileStyles: {} as Record<string, FileStyleDefinition>,
	folderStyles: {} as Record<string, FolderStyleDefinition>,
	filePatterns: [] as FilePattern[],
	folderPatterns: [] as FolderPattern[],
	colors: DEFAULT_COLORS,
};

export type NoteIconsSettings = typeof DEFAULT_SETTINGS;
