# Dad Paid

A stupidly simple family travel expense tracker.

Not corporate finance. Not spreadsheets. Not "splitwise for roommates arguing over ₹82."

Just: *who paid, how much, what for, where are we going tomorrow.*

Because on every trip, dad paid.

## Live

→ **https://dadpaid.vercel.app**

Mobile-first. Open on phone, add to home screen for the PWA experience (offline + no URL bar).

## What it does

- **Hub.** Landing page after sign-in. Shows the active trip, past trips archive, and a button to start a new one.
- **Keypad as home.** Three faces, pre-set cards per person, big number pad, one-tap split rule.
- **Ledger.** Every expense grouped by day, pre-trip expenses (flights, hotels) up top. Tap any row to edit.
- **Summary.** Category bars, who-paid bars, live settlement (min cash-flow).
- **Tomorrow.** Events with times, vault for PDFs (tickets, bookings). Tap to edit.
- **Multi-currency.** GBP, INR, EUR, USD side-by-side. No forex math. Per-currency settlement.
- **Offline-first.** localStorage + IndexedDB + service worker. Add expenses on the Tube, syncs when back online.
- **CSV export.** Full expense data, anytime.

## Stack

- Single self-contained `index.html`. React 18 + Babel via CDN, no build step.
- `sw.js`. Service worker for offline shell caching.
- Supabase backend: Postgres, Auth (magic link), Realtime, Storage.
- Persistence: localStorage (state cache) + IndexedDB (receipt photos).
- Bauhaus design system: mustard, ink, cream. Funnel Display + IBM Plex Mono.
- PWA manifest + icons. Installable on iOS and Android.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Roadmap

This is a working v1. Next milestones:

- Quick-add presets (Tube · £2.80 with one tap)
- Apple / Google sign-in
- LLM categorization (Haiku, auto-categorize after save)
- Member avatar uploads (photos instead of initials)
- Settlement actions (mark debts as paid)
- Receipt OCR (vision model fills amount + merchant from photo)
