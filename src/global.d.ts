interface SFIconManagerAPI {
	getIcons(): import("./settings").IconDefinition[];
	getIconById(id: string): import("./settings").IconDefinition | null;
	onIconsChanged(callback: () => void): () => void;
}

interface Window {
	SFIconManager?: SFIconManagerAPI;
}
