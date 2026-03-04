import { applyI18n, initI18n, t } from "./i18n.js";
import { STORAGE_KEYS, storageGet, storageSet } from "./storage.js";

function readerUrl(query = "") {
  const suffix = query ? `?${query}` : "";
  return chrome.runtime.getURL(`reader.html${suffix}`);
}

async function openReader(query = "") {
  await chrome.tabs.create({ url: readerUrl(query) });
  globalThis.close();
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCodePoint(...chunk);
  }

  return btoa(binary);
}

async function toPendingBookPayload(file) {
  const buffer = await file.arrayBuffer();
  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    lastModified: file.lastModified || Date.now(),
    dataBase64: arrayBufferToBase64(buffer),
  };
}

async function init() {
  await initI18n();
  applyI18n();

  const openBookBtn = document.getElementById("open-book");
  const openLastBtn = document.getElementById("open-last");
  const openSettingsBtn = document.getElementById("open-settings");
  const popupFileInput = document.getElementById("popup-file-input");
  const statusNode = document.getElementById("status");

  openBookBtn.addEventListener("click", () => {
    popupFileInput.value = "";
    popupFileInput.click();
  });

  popupFileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const payload = await toPendingBookPayload(file);
      await storageSet(STORAGE_KEYS.pendingBookUpload, payload);
      await openReader("pending=1");
    } catch {
      statusNode.textContent = t("openFailed");
    }
  });

  openLastBtn.addEventListener("click", () => openReader("last=1"));
  openSettingsBtn.addEventListener("click", async () => {
    await chrome.runtime.openOptionsPage();
    globalThis.close();
  });

  try {
    const lastBook = await storageGet(STORAGE_KEYS.lastBook);
    if (lastBook?.title) {
      statusNode.textContent = `${t("lastBook")}: ${lastBook.title}`;
    } else {
      statusNode.textContent = t("statusNoRecentBook");
    }
  } catch {
    statusNode.textContent = t("statusNoRecentBook");
  }
}

await init();
