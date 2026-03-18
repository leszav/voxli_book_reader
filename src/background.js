import { STORAGE_KEYS, storageGet } from "./storage.js";

chrome.action.onClicked.addListener(async () => {
  try {
    const last = await storageGet(STORAGE_KEYS.lastBook);
    if (last && Array.isArray(last.chapters) && last.chapters.length > 0) {
      await chrome.tabs.create({ url: chrome.runtime.getURL("reader.html?last=1") });
      return;
    }

    // No recent book — open filepicker popup to let user select file
    await chrome.windows.create({ url: chrome.runtime.getURL("filepicker.html"), type: "popup", width: 560, height: 360 });
  } catch (error) {
    // Fallback: open reader page
    await chrome.tabs.create({ url: chrome.runtime.getURL("reader.html") });
  }
});
