import { STORAGE_KEYS, storageSet } from "./storage.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("picker-file-input");
  if (!input) return;

  input.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const payload = await toPendingBookPayload(file);
      await storageSet(STORAGE_KEYS.pendingBookUpload, payload);
      await chrome.tabs.create({ url: chrome.runtime.getURL("reader.html?pending=1") });
      window.close();
    } catch (err) {
      // If something goes wrong, just close and open reader for manual retry
      await chrome.tabs.create({ url: chrome.runtime.getURL("reader.html") });
      window.close();
    }
  });

  // Trigger file picker immediately (user gesture originates from action click)
  input.click();
});
