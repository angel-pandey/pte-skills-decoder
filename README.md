# PTE Skills Profile Decoder

An interactive, premium diagnostic client-side dashboard designed to decode Pearson Test of English (PTE) scorecard subprofile skills and pinpoint exactly which task types require a test-taker's focus.

Created and written by **[Angel Pandey](https://angelpandey.com)**. Inspired by the **[LA PTE Video (YouTube)](Https://youtu.be/QZM4JvHw4po?si=EsKkVDuMWpDUt_tC)**.

This application is **100% serverless, secure, and offline-ready**. It processes your scores entirely inside the browser without transmitting or storing any personal scorecard data.

---

## 🚀 Key Features

- **Pill-Segmented Navbar Control:** A streamlined navigation header containing tabs for Paste API JSON, Visual Sliders, and Help, saving screen height and maximizing workspace efficiency.
- **Sun/Moon Theme Switcher:** Fully integrated Light and Dark mode options. It defaults to the user's OS preference (`prefers-color-scheme`) and persists their theme choice in local browser storage.
- **Scorecard JSON Extraction Decoder:** Paste the response data directly from your Pearson portal network request (`skills?ignoreCache=false`) to instantly parse and populate all scores.
- **Visual Score Sliders:** Simulated visual inputs allow you to manually adjust the 8 subprofile bars and 5 communicative scores, with "Load Sample Data" buttons pre-populating inputs instantly.
- **Factual Deduction Engine:** Evaluates subskill score asymmetries on-the-fly to isolate target weaknesses (e.g., distinguishing between oral reproduction errors and transcription errors) using strict diagnostic facts.
- **Three-Tier Performance Focus:**
  - 🛑 **Strong Focus Required:** Tasks where **all** mapped contributing subskills are low (score < target benchmark).
  - ⚠️ **Requires Attention (Mixed):** Tasks mapped to a mixture of both high and low subskills.
  - ✅ **Strong / Good:** Tasks where **all** contributing subskills are strong (score &ge; target benchmark).
- **Customizable Target Benchmark:** You are no longer locked into the default 88 score. Set your own target threshold (10-90) and instantly watch the dashboard logically re-evaluate all your weaknesses, colors, and diagnostic advice on-the-fly.
- **Interactive Skills Matrix:** A dynamic comparison grid mapping the 22 PTE question types against the 8 subskills, complete with neutral-to-colored highlight animations post-analysis.

---

## 📁 Repository Structure

The repository consists of the following core assets:

```
decode-pte-result/
├── index.html        # Single Page Application structure & layout
├── style.css         # Glassmorphic layout styling & dark/light variables
├── app.js            # JSON parser, deduction engine & dynamic updates
├── manifest.json     # PWA manifest metadata configuration
└── sw.js             # Offline service worker asset caching script
```

---

## 💡 How It Works (Core Assumptions)

The engine maps the 8 subskills to the 22 question types according to the official PTE specifications:

1. **ORSW** - Open Response Speaking and Writing
2. **RSWL** - Reproducing Spoken and Written Language
3. **EW** - Extended Writing
4. **SW** - Short Writing
5. **ES** - Extended Speaking
6. **SS** - Short Speaking
7. **MSC** - Multiple-skills Comprehension
8. **SSC** - Single-skill Comprehension

### Logic Rule Example:
If the **Reproducing Language (RSWL)** bar is low, but **Short Writing (SW)** is high, the engine isolates the error to speaking-only reproduction (e.g., *Read Aloud*, *Repeat Sentence*) rather than written-transcription tasks (e.g., *Write from Dictation*).

---

## 🛠️ Setup & Running

This is a static HTML/JS/CSS application. It requires **no server, build steps, or installations**.

1. Download or clone this repository.
2. Open **`index.html`** in any modern web browser (by double-clicking or dragging it into the browser window).

---

## 🔒 Security & Privacy

- All calculations occur in-memory directly in your browser tab.
- No cookies, analytics, or trackers.
- No network requests are made. Your scores never leave your computer.

---

## 💬 Feedback & Issues

Have suggestions, found a bug, or want to suggest improvement? Please open an issue or submit a pull request on the **[GitHub Repository](https://github.com/angel-pandey/pte-skills-decoder)**.
