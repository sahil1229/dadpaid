# Dad Paid

A stupidly simple family travel expense tracker.

Not corporate finance. Not spreadsheets. Not "splitwise for roommates arguing over ₹82."

Just: *who paid, how much, what for, where are we going tomorrow.*

Because on every trip — dad paid.

## Live

→ **https://sahil1229.github.io/dadpaid/**

Mobile-first. Open on phone, add to home screen for the PWA experience (offline + no URL bar).

## What it does

- **Keypad as home** — three faces, pre-set cards per person, big number pad, one-tap split rule
- **Ledger** — every expense grouped by day, pre-trip expenses (flights, hotels) up top
- **Summary** — category bars, who-paid bars, live settlement (min cash-flow)
- **Tomorrow** — events with times, vault for PDFs (tickets, bookings)
- **Multi-currency** — GBP and INR side-by-side, no forex math, per-currency settlement
- **Offline-first** — localStorage + IndexedDB + service worker. Add expenses on the Tube, syncs when back online
- **CSV export** — full expense data, anytime

## Stack

- Single self-contained `index.html` — React 18 + Babel via CDN, no build step
- `sw.js` — service worker for offline shell caching
- Persistence: localStorage (state) + IndexedDB (receipt photos)
- Bauhaus design system, mustard + ink + cream palette, Funnel Display + IBM Plex Mono

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Roadmap

This is a working prototype. Next milestones:

- Setup wizard for new trips (currently London Dec '25 is hardcoded)
- Tap-to-edit expenses
- Quick-add presets (Tube · £2.80 with one tap)
- Multi-trip switcher
- Supabase backend (real sync across phones, family-account auth)
- LLM categorization (Haiku — auto-categorize after save)
