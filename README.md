<p align="center">
  <img src="icons/icon-128.png" width="96" height="96" alt="Copy Selected Tab URLs icon">
</p>

# Copy Selected Tab URLs

A lightweight Chrome extension for copying URLs from selected tabs in one click.

It is built for the tab workflow Chrome already supports: select tabs with Shift-click or Command-click, click the extension, and paste a clean list of links anywhere.

## Demo

<video src="https://zingy-harbor-ykgr.here.now/export-1779910657943.mp4" controls muted loop playsinline width="100%"></video>

## Features

- Copy the URLs of all selected Chrome tabs.
- Preserve tab order from left to right.
- Show the selected tab count directly on the extension badge.
- Show a short check mark after a successful copy.
- Separate URLs with line breaks and spaces, so links stay readable even in fields that strip newlines.
- Works from the toolbar icon and from the extension icon context menu.
- Uses Manifest V3.
- No tracking, no analytics, no network requests.

## Install

### From a GitHub release

1. Download `copy-selected-tab-urls-v1.0.1.zip` from the latest release.
2. Unzip it.
3. Open `chrome://extensions`.
4. Enable Developer mode.
5. Click Load unpacked.
6. Select the unzipped folder.

### From source

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the repository folder.

## Usage

1. Select tabs with Shift-click or Command-click.
2. Click the Copy Selected Tab URLs extension icon.
3. Paste.

The copied output looks like this:

```text
https://github.com/ 
https://developer.chrome.com/docs/extensions/ 
https://www.wikipedia.org/ 
```

The trailing spaces are intentional. If an app removes newlines on paste, the URLs still remain separated by spaces.

## Permissions

This extension asks for the smallest practical set of Chrome permissions for the job:

- `tabs`: read the URLs of the selected tabs.
- `clipboardWrite`: write the copied URL list to your clipboard.
- `contextMenus`: add the copy command to the extension context menu.
- `offscreen`: support reliable clipboard writes from a Manifest V3 service worker.

It does not send tab data anywhere.

## Notes

Some Chrome versions do not allow extension items inside the native tab context menu. When that API is unavailable, the extension automatically falls back to the extension icon context menu. Clicking the toolbar icon works either way.

## Development

This is plain JavaScript, HTML, and a Manifest V3 file. There is no build step.

Useful local checks:

```sh
node --check background.js
node --check offscreen.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'))"
```

## License

MIT
