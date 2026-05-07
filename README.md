# TalentFlow ATS

ATS (Applicant Tracking System) completo costruito con **Vue.js 3** e **Bootstrap 5**, integrato con **LinkedIn**.

## Funzionalità

- **Dashboard** con KPI live e tre grafici (trend candidature, sorgenti, pipeline)
- **Pipeline Kanban** con drag & drop tra le 6 fasi (Candidatura → Screening → Colloquio → Offerta → Assunto / Rifiutato)
- **Gestione candidati**: lista filtrabile, dettaglio con esperienze e formazione, rating a stelle, timeline attività, modifica e cancellazione
- **Gestione posizioni** (job openings): creazione, dettaglio, modifica, stato (Aperta / In pausa / Chiusa)
- **Colloqui**: scheduling, raggruppamento per giorno, marca completato/annullato
- **Report & Analytics**: funnel, andamento mensile, top posizioni, sorgenti, tempo medio di assunzione, tasso di conversione
- **Integrazione LinkedIn**:
  - Connessione demo (1 click) o flow OAuth reale (configurabile con il proprio Client ID)
  - Importa candidato da URL pubblico LinkedIn
  - Ricerca profili (con dataset demo)
  - Pubblicazione job su LinkedIn (mock + share URL reale)
- **Ricerca globale** (candidati, posizioni, skill)
- **Dark mode**
- **Persistenza** automatica su localStorage
- **Backup/Import** in JSON
- Completamente **responsive**, **in italiano**

## Avvio rapido

L'app non richiede build step — è un'applicazione Vue 3 standalone caricata via CDN come ES Modules.

### Opzione 1: server statico locale (consigliato)

```powershell
# Python (preinstallato su Windows con Python)
python -m http.server 5500

# Oppure con Node.js
npx serve -p 5500
```

Poi apri [http://localhost:5500](http://localhost:5500).

### Opzione 2: estensione VS Code "Live Server"

Tasto destro su `index.html` → **Open with Live Server**.

> Nota: l'apertura diretta del file `index.html` con `file://` non funziona perché i moduli ES richiedono il protocollo `http(s)`.

## Struttura del progetto

```
ats/
├── index.html            # Entry point con CDN imports
├── css/
│   └── styles.css        # Stili custom (layout, kanban, dark mode...)
└── js/
    ├── app.js            # Bootstrap dell'app + Vue Router
    ├── store.js          # State globale reattivo + persistenza localStorage
    ├── linkedin.js       # Modulo integrazione LinkedIn (OAuth + import + post)
    ├── components/
    │   ├── AppShell.js   # Layout (sidebar, topbar, ricerca, notifiche)
    │   └── Avatar.js
    └── pages/
        ├── Dashboard.js
        ├── Pipeline.js
        ├── Candidates.js
        ├── CandidateDetail.js
        ├── CandidateNew.js
        ├── Jobs.js
        ├── JobDetail.js
        ├── JobNew.js
        ├── Interviews.js
        ├── Reports.js
        ├── LinkedInPage.js
        ├── Settings.js
        └── NotFound.js
```

## Stack tecnologico

| Layer | Tecnologia | Versione |
|---|---|---|
| Framework | Vue.js (ESM browser build) | 3.4 |
| Routing | Vue Router | 4.4 |
| UI | Bootstrap | 5.3 |
| Iconografia | Bootstrap Icons | 1.11 |
| Grafici | Chart.js | 4.4 |
| Persistenza | localStorage browser | — |

Tutto via CDN, nessuna dipendenza npm da installare.

## Integrazione LinkedIn

L'app supporta due modalità:

### 1. Demo (default)
Un click su "Connetti (Demo)" simula la connessione e abilita tutte le funzionalità (import profili, ricerca, pubblicazione job).

### 2. OAuth reale
1. Crea un'app su [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Aggiungi i prodotti **Sign In with LinkedIn using OpenID Connect** e (opzionale) **Share on LinkedIn**
3. Imposta come Redirect URL: `<TUA-ORIGIN>/linkedin/callback`
4. Inserisci il **Client ID** in `Impostazioni → LinkedIn` (oppure direttamente nella pagina di integrazione)
5. Clicca su "OAuth reale"

> **Importante**: lo scambio `code → access_token` richiede il `client_secret` e va effettuato server-side per non esporre il segreto. L'app espone l'URL atteso `/api/linkedin/token` da implementare nel proprio backend (per esempio Express, FastAPI, Next.js API route).

Gli scope richiesti sono: `openid profile email w_member_social`.

## Dati di esempio

All'avvio l'app carica un dataset realistico con:
- 5 posizioni aperte
- 9 candidati distribuiti su tutte le fasi
- 4 colloqui (3 in programma, 1 completato)
- Storico attività

Puoi resettare in qualsiasi momento da **Impostazioni → Backup → Reset dati**.

## Personalizzazione

- **Brand & nome azienda**: `Impostazioni → Azienda`
- **Tema chiaro/scuro**: pulsante in fondo alla sidebar
- **Pipeline**: edita gli stage in `js/store.js` (costante `STAGES`)
- **Sorgenti**: ogni candidato ha un campo `source` libero
- **Backup**: esporta e reimporta JSON da Impostazioni
