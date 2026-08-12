# Expense Tracker

*Auto-captures receipts from Gmail via hotkey, plus manual entry for cash, rent, and anything else without an email trail.*

A full-stack expense tracker with two ways to add a transaction: a hotkey-triggered capture that pulls purchase receipts straight from your open Gmail inbox (no OCR, no ML — just DOM parsing and rule-based extraction), and a manual entry form for everything email doesn't cover — cash payments, rent, Venmo requests, anything off the grid.

## What it does

**Gmail capture:**
1. Press a global hotkey while reading a receipt email in Gmail
2. The app reads the open email's text directly from the page (subject, sender, body)
3. Parses out the merchant, amount, and date using rule-based extraction (regex/Cheerio, per-merchant templates)
4. Saves it as a transaction and shows a quick popup confirmation

**Manual entry:**
1. Open the dashboard and click "Add expense"
2. Fill in amount, merchant/description, category, and date
3. Saves the same way as a captured transaction, just tagged with a different source

Anything the Gmail parser can't confidently extract gets flagged for manual review instead of guessing — so manual entry also doubles as the fix-up flow for bad captures, not just a separate feature bolted on.

Both paths feed the same dashboard — spending breakdowns by category and month don't care whether a transaction came from an email or was typed in by hand.

## Why this project

Most "expense tracker" portfolio projects are CRUD-with-auth. This one adds two things that are rare in typical bootcamp-style projects and genuinely interesting to talk about in interviews:

- **Real-world messy data extraction** — parsing inconsistent HTML receipt formats without training a model, and being explicit about the scaling tradeoff (rule-based parsers scale with engineering effort, not automatically — naming that tradeoff on purpose)
- **Cross-process communication** — a browser extension, a desktop app, and a backend all coordinating around a single user action (the hotkey press)

## Architecture

```
 ┌─────────────────┐        ┌──────────────────────┐
 │ Browser Extension│        │   Electron Desktop App│
 │ (content script   │       │   (global hotkey +    │
 │  on mail.google.com)      │    popup UI)           │
 └─────────┬────────┘        └──────────┬────────────┘
           │  POST /capture             │  GET /latest-capture (poll)
           ▼                            ▼
        ┌───────────────────────────────────┐
        │         Backend (Express)          │
        │  - parses email text (regex/Cheerio)│
        │  - dedups by email content hash     │
        │  - stores transactions              │
        └────────────────┬────────────────────┘
                          ▼
                   ┌─────────────┐
                   │   MongoDB    │
                   └─────────────┘
                          ▲
                          │
                ┌───────────────────┐
                │  React Dashboard   │
                │ (spend by category, │
                │  needs-review queue,│
                │  + manual entry form)│
                └───────────────────┘
```

Manual entries go straight from the dashboard to `POST /transactions` on the backend — same storage path as captured ones, just tagged `source: 'manual'` instead of `source: 'gmail'`.

**No component talks directly to another across process boundaries — everything routes through the backend.** This trades a small amount of UI latency (~1-2s) for avoiding native messaging setup, which is the most fragile/unfamiliar part of a project like this.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js / Express |
| Database | MongoDB (Mongoose) |
| Frontend dashboard | React |
| Browser extension | Manifest V3, content script |
| Desktop app | Electron |
| Parsing | Regex + Cheerio (no OCR, no ML) |

## Core design decisions (and why)

- **DOM text over screenshots/OCR** — reading Gmail's rendered HTML avoids introducing any ML dependency (OCR engines are model-based even when "lightweight"), keeping this a pure SWE project.
- **Backend as the only relay** — the extension and the Electron app never talk to each other directly. Both just call the backend, which is a pattern that's easy to build and easy to reason about.
- **Dedup by content, not trust** — captures are deduplicated (via email content hash / Gmail message ID) so re-triggering the hotkey on the same email never double-counts.
- **Sender-specific parsers + generic fallback** — a handful of hardcoded merchant templates (Amazon, Uber, DoorDash, etc.) handle the common cases; anything else falls back to a generic regex and gets flagged `needsReview` for the user to confirm.
- **One schema, two sources** — manual and Gmail-captured transactions share the same `Transaction` model with a `source` field (`'gmail' | 'manual'`). This keeps the dashboard, aggregation queries, and review flow identical regardless of where a transaction came from, instead of maintaining two parallel systems.

## Status

- [ ] Backend: parsing logic + Mongo schema
- [ ] Backend: capture + latest-capture endpoints
- [ ] Browser extension: content script + Gmail selectors
- [ ] Electron app: global hotkey + popup + polling
- [ ] React dashboard: category/month breakdown, needs-review queue
- [ ] React dashboard: manual entry form
- [ ] Deploy

## Roadmap / possible v2

- Replace backend-relay with native messaging for instant (non-polled) popup updates
- Support for more merchant templates
- Bank/credit card email alert parsing in addition to purchase receipts

## Setup

_To be filled in once implementation starts._