const MENU_ID = "copy-selected-tab-urls";
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const COPY_SUCCESS_BADGE = "✓";
const ERROR_BADGE = "!";
const EMPTY_BADGE = "0";
const SELECTION_BADGE_COLOR = "#1a73e8";
const SUCCESS_BADGE_COLOR = "#188038";
const ERROR_BADGE_COLOR = "#d93025";

let creatingOffscreenDocument;
let restoreBadgeTimeout;

chrome.runtime.onInstalled.addListener(setupExtension);
chrome.runtime.onStartup.addListener(setupExtension);
chrome.action.onClicked.addListener((tab) => {
  copySelectedTabUrls(tab).catch(handleError);
});
chrome.tabs.onHighlighted.addListener(({ windowId }) => {
  updateSelectedTabCount(windowId).catch(handleError);
});
chrome.tabs.onActivated.addListener(({ windowId }) => {
  updateSelectedTabCount(windowId).catch(handleError);
});
chrome.tabs.onRemoved.addListener((_tabId, removeInfo) => {
  updateSelectedTabCount(removeInfo.windowId).catch(handleError);
});
chrome.tabs.onCreated.addListener((tab) => {
  updateSelectedTabCount(tab.windowId).catch(handleError);
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    updateSelectedTabCount(windowId).catch(handleError);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  copySelectedTabUrls(tab).catch(handleError);
});

async function setupExtension() {
  await createContextMenu();
  await updateSelectedTabCount();
}

async function createContextMenu() {
  await removeAllContextMenus();

  try {
    await createCopyMenu(["tab"]);
  } catch (error) {
    console.warn("[Copy Selected Tab URLs] Tab context menu is unavailable in this Chrome version.", error);
    await createCopyMenu(["action"]);
  }
}

function removeAllContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(resolve);
  });
}

function createCopyMenu(contexts) {
  return new Promise((resolve, reject) => {
    try {
      chrome.contextMenus.create(
        {
          id: MENU_ID,
          title: "Copiar URLs das guias selecionadas",
          contexts
        },
        () => {
          const error = chrome.runtime.lastError;
          error ? reject(new Error(error.message)) : resolve();
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function copySelectedTabUrls(clickedTab) {
  const tabs = await getSelectedTabs(clickedTab);
  const urls = tabs
    .sort((left, right) => left.index - right.index)
    .map((tab) => tab.url || tab.pendingUrl)
    .filter(Boolean);

  if (urls.length === 0) {
    await flashBadge(EMPTY_BADGE, ERROR_BADGE_COLOR, clickedTab?.windowId);
    return;
  }

  await copyToClipboard(formatUrlsForClipboard(urls));
  await flashBadge(COPY_SUCCESS_BADGE, SUCCESS_BADGE_COLOR, clickedTab?.windowId);
}

function formatUrlsForClipboard(urls) {
  return urls.join(" \n ");
}

async function getSelectedTabs(clickedTab) {
  const windowId = clickedTab?.windowId;

  const selectedTabs = await chrome.tabs.query(
    typeof windowId === "number"
      ? { highlighted: true, windowId }
      : { highlighted: true, currentWindow: true }
  );

  return selectedTabs.length > 0 ? selectedTabs : clickedTab ? [clickedTab] : [];
}

async function updateSelectedTabCount(windowId) {
  const tabs = await getSelectedTabs(
    typeof windowId === "number" ? { windowId } : undefined
  );
  const count = tabs.length;

  await chrome.action.setBadgeBackgroundColor({ color: SELECTION_BADGE_COLOR });
  await chrome.action.setBadgeText({ text: count > 1 ? String(count) : "" });
}

async function copyToClipboard(text) {
  await ensureOffscreenDocument();

  const response = await chrome.runtime.sendMessage({
    target: "offscreen",
    type: "copy-to-clipboard",
    text
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Could not copy text to clipboard.");
  }

  await chrome.offscreen.closeDocument().catch(() => {});
}

async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen
      .createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ["CLIPBOARD"],
        justification: "Copy selected tab URLs to the clipboard."
      })
      .finally(() => {
        creatingOffscreenDocument = undefined;
      });
  }

  await creatingOffscreenDocument;
}

async function flashBadge(text, color, windowId) {
  clearTimeout(restoreBadgeTimeout);
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });

  restoreBadgeTimeout = setTimeout(() => {
    updateSelectedTabCount(windowId).catch(handleError);
  }, 1200);
}

async function handleError(error) {
  console.error("[Copy Selected Tab URLs]", error);
  await flashBadge(ERROR_BADGE, ERROR_BADGE_COLOR);
}
