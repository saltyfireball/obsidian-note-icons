# Note Icons

![USB Stick](https://img.shields.io/badge/usb%20stick-contains%20mystery%20files-fff?style=flat&logo=usb&logoColor=FFFFFF&label=usb%20stick&labelColor=5B595C&color=78DCE8) ![Burnout](https://img.shields.io/badge/burnout-speedrunning-fff?style=flat&logo=speedtest&logoColor=FFFFFF&label=burnout&labelColor=5B595C&color=FF6188) ![Tests](https://img.shields.io/badge/tests-we%20dont%20do%20that%20here-fff?style=flat&logo=jest&logoColor=FFFFFF&label=tests&labelColor=5B595C&color=78DCE8) ![Git Message](https://img.shields.io/badge/git%20message-asdfasdf-fff?style=flat&logo=git&logoColor=FFFFFF&label=git%20message&labelColor=5B595C&color=5C7CFA) ![Pet Rock](https://img.shields.io/badge/pet%20rock-fed-fff?style=flat&logo=githubsponsors&logoColor=FFFFFF&label=pet%20rock&labelColor=5B595C&color=AB9DF2) ![CD](https://img.shields.io/badge/cd-AOL%20free%20trial-fff?style=flat&logo=discogs&logoColor=FFFFFF&label=CD&labelColor=5B595C&color=FC9867) ![Coffee](https://img.shields.io/badge/coffee-IV%20drip-fff?style=flat&logo=buymeacoffee&logoColor=FFFFFF&label=coffee&labelColor=5B595C&color=5C7CFA) ![Fridge](https://img.shields.io/badge/fridge-runs%20linux-fff?style=flat&logo=linux&logoColor=FFFFFF&label=fridge&labelColor=5B595C&color=A9DC76) ![Logging](https://img.shields.io/badge/logging-console.log%20go%20brrr-fff?style=flat&logo=papertrail&logoColor=FFFFFF&label=logging&labelColor=5B595C&color=FFD866)

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
