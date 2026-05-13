const STORAGE_KEY = "talentflowExtensionImport";

function isAtsNewCandidateUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    if (!/^https?:$/i.test(u.protocol)) return false;
    const h = u.hash || "";
    const p = u.pathname || "";
    return (
      h.includes("candidates/new") ||
      p.includes("candidates/new")
    );
  } catch {
    return false;
  }
}

const SESSION_IMPORT_KEY = "__TF_ATS_LI_IMPORT__";

function injectProfileIntoTab(tabId, profile) {
  return chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [profile, SESSION_IMPORT_KEY],
    func: (payload, storageKey) => {
      const deliver = () => {
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({ v: 1, at: Date.now(), payload })
          );
        } catch (e) {
          console.warn("TalentFlow sessionStorage import", e);
        }
        try {
          window.__TALENTFLOW_EXTENSION_IMPORT__ = payload;
          window.dispatchEvent(
            new CustomEvent("talentflow-extension-import", { detail: payload })
          );
        } catch (e) {
          console.warn("TalentFlow import deliver", e);
        }
      };
      deliver();
      setTimeout(deliver, 400);
      setTimeout(deliver, 1100);
      setTimeout(deliver, 2200);
      setTimeout(deliver, 3800);
      setTimeout(deliver, 5500);
    },
  });
}

function tryDeliverImportToTab(tabId) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const entry = result[STORAGE_KEY];
    if (!entry?.profile) return;

    const maxAgeMs = 10 * 60 * 1000;
    const at = new Date(entry.at).getTime();
    if (Number.isNaN(at) || Date.now() - at > maxAgeMs) {
      chrome.storage.local.remove(STORAGE_KEY);
      return;
    }

    injectProfileIntoTab(tabId, entry.profile)
      .then(() => chrome.storage.local.remove(STORAGE_KEY))
      .catch((e) => console.warn("TalentFlow injectProfileIntoTab", e));
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab?.url) return;
  if (!isAtsNewCandidateUrl(tab.url)) return;

  const urlChanged = Object.prototype.hasOwnProperty.call(changeInfo, "url");
  const finished =
    changeInfo.status === "complete" || (urlChanged && tab.url);

  if (!finished) return;

  tryDeliverImportToTab(tabId);
});

function pollDeliverAfterOpen(tabId) {
  const delays = [150, 400, 700, 1100, 1600, 2200, 3000, 4500, 6500];
  delays.forEach((ms) => {
    setTimeout(() => {
      chrome.tabs.get(tabId, (t) => {
        if (chrome.runtime.lastError || !t?.url || !isAtsNewCandidateUrl(t.url)) {
          return;
        }
        tryDeliverImportToTab(tabId);
      });
    }, ms);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "STORE_IMPORT_AND_OPEN_ATS") {
    const payload = message.payload;
    if (!payload) {
      sendResponse({ ok: false, error: "Payload mancante" });
      return true;
    }
    chrome.storage.local.set(
      {
        [STORAGE_KEY]: {
          version: 1,
          at: new Date().toISOString(),
          profile: payload,
        },
      },
      () => {
        const url =
          message.atsOrigin ||
          "http://localhost:5500/#/candidates/new";
        chrome.tabs.create({ url, active: true }, (tab) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              ok: false,
              error: chrome.runtime.lastError.message,
            });
            return;
          }
          sendResponse({ ok: true });
          if (tab?.id) {
            pollDeliverAfterOpen(tab.id);
          }
        });
      }
    );
    return true;
  }
  return false;
});
