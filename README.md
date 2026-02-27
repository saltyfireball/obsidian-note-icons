# Note Icons

An Obsidian plugin for assigning custom icons, colors, and styles to files and folders in the file explorer and inline titles.

## Features

- **File and folder icons** - Assign custom icons to individual files and folders via the file context menu
- **Color palette** - Configurable named color palette used across all styling features
- **Regex pattern matching** - Bulk-style files and folders using regex patterns with drag-and-drop reordering
- **Title and nav colors** - Customize inline title colors and file explorer nav text colors per file, folder, or pattern
- **Icon coloring** - Tint icons with any color from your palette
- **Folder open/closed states** - Separate icon and color assignments for open vs closed folder states
- **SFIconManager integration** - Exposes a global API (`window.SFIconManager`) for other plugins to provide icon libraries

## Installation

### Community Plugins (Recommended)

1. Open **Settings > Community Plugins** in Obsidian
2. Search for **Note Icons**
3. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/saltyfireball/obsidian-note-icons/releases/latest)
2. Create a folder at `<vault>/.obsidian/plugins/obsidian-note-icons/`
3. Place the downloaded files in that folder
4. Restart Obsidian and enable the plugin in **Settings > Community Plugins**

## Usage

### Assigning Icons to Files/Folders

Right-click any file or folder in the file explorer and select **Set icon** to open the icon picker. Choose an icon and optionally a color.

### Pattern Matching

In the plugin settings under the **Patterns** tab, add regex patterns to automatically style files or folders that match. Patterns are evaluated in order (top to bottom) and can be reordered via drag-and-drop.

### Color Palette

The **Colors** tab in settings lets you define named colors. These colors appear in icon pickers and pattern configuration throughout the plugin.

### Title and Nav Colors

Each file style, folder style, and pattern supports:
- **Title color** - Changes the inline title color in the editor
- **Nav color** - Changes the text color in the file explorer sidebar

## License

MIT
