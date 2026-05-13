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

/**
 * Scraping nel MAIN world della pagina LinkedIn (stesso contesto della UI).
 * Il content script isolato a volte non riceve risposte utili da sendMessage.
 */
async function scrapeFromTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      files: ["linkedin-profile-scrape.js"],
    });
  } catch (e) {
    return {
      ok: false,
      error: e?.message || String(e) || "Impossibile iniettare lo scraper (permessi / URL).",
    };
  }

  try {
    const frames = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        const fn = globalThis.__tfScrapeProfile;
        if (typeof fn !== "function") {
          return {
            ok: false,
            error: "Scraper non caricato: ricarica il tab LinkedIn e riprova.",
          };
        }
        return fn();
      },
    });
    const result = frames?.[0]?.result;
    if (!result || typeof result !== "object") {
      return { ok: false, error: "Nessun dato dallo scraper (risposta vuota)." };
    }
    return result;
  } catch (e) {
    return {
      ok: false,
      error: e?.message || String(e) || "Lettura profilo fallita.",
    };
  }
}

function summarizePayload(p) {
  if (!p) return "";
  const bits = [
    p.name ? `nome: ${p.name.slice(0, 40)}` : null,
    p.headline ? `headline: ${p.headline.slice(0, 50)}…` : "headline: (vuoto)",
    p.location ? `loc: ${p.location.slice(0, 40)}` : "loc: (vuoto)",
    Array.isArray(p.skills) ? `skill: ${p.skills.length}` : "skill: 0",
  ];
  return bits.filter(Boolean).join(" · ");
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

    setStatus(
      `OK. ${summarizePayload(res.payload)} — tab ATS aperto (Spark). Se i campi restano vuoti, ricarica Nuovo candidato.`,
      "ok"
    );
  } catch (e) {
    setStatus(e.message || String(e), "err");
  } finally {
    btn.disabled = false;
  }
});
