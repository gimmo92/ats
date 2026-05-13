function setStatus(msg, cls) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = cls || "";
}

function normalizeOrigin(raw) {
  let o = (raw || "").trim();
  if (!o) return "http://localhost:5500";
  o = o.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(o)) o = `http://${o}`;
  return o;
}

function isLinkedInProfileTab(url) {
  return /linkedin\.com\/in\//i.test(url || "");
}

async function scrapeFromTab(tabId) {
  let res;
  try {
    res = await chrome.tabs.sendMessage(tabId, { action: "SCRAPE_PROFILE" });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-linkedin.js"],
    });
    await new Promise((r) => setTimeout(r, 200));
    res = await chrome.tabs.sendMessage(tabId, { action: "SCRAPE_PROFILE" });
  }
  return res;
}

document.getElementById("go").addEventListener("click", async () => {
  const btn = document.getElementById("go");
  const origin = normalizeOrigin(document.getElementById("origin").value);
  const atsUrl = `${origin}/#/candidates/new`;

  setStatus("");
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus("Nessun tab attivo.", "err");
      return;
    }
    const u = tab.url || "";
    if (!isLinkedInProfileTab(u)) {
      setStatus("Vai su un profilo LinkedIn (URL con /in/).", "err");
      return;
    }

    const res = await scrapeFromTab(tab.id);
    if (!res?.ok) {
      setStatus(res?.error || "Estrazione fallita.", "err");
      return;
    }

    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "STORE_IMPORT_AND_OPEN_ATS",
          payload: res.payload,
          atsOrigin: atsUrl,
        },
        (r) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!r?.ok) reject(new Error(r?.error || "Errore"));
          else resolve();
        }
      );
    });

    setStatus("Tab ATS aperto. Completa e salva il candidato.", "ok");
  } catch (e) {
    setStatus(e.message || String(e), "err");
  } finally {
    btn.disabled = false;
  }
});