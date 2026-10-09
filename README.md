# Expense Tracker

A MERN-stack expense tracker with manual entry, custom categories, optional budgets, recurring items, monthly statements, and an interactive tabbed dashboard — built as a personal project to actually understand the full stack end to end, not just to ship a finished app.

## What it does

**Expenses**
- Add, edit, or delete an expense from a modal: amount, shop name, category (optional), date (calendar picker), optional notes, optional "mixed products" flag
- Add from the header button, the floating `+` button, or the `a` keyboard shortcut (ignored while typing in a field)
- No category selected → treated as **Miscellaneous** everywhere (display, filtering, summaries); checking "mix of different products" auto-suggests Miscellaneous too, but can be overridden
- Pick from default categories (Food, Rent, Transport, Shopping, Entertainment, Utilities, Miscellaneous) or create your own — custom categories persist and show up as options going forward
- Search by shop name, filter by category, and sort (newest/oldest, amount high↔low, shop name A–Z) — filter and sort choices persist across reloads
- Delete and update both require a confirmation step; bulk "Clear All" (all expenses, by category, all budgets, or a single budget) is confirmed too
- Toast notifications confirm actions

**Months and summaries**
- Everything is scoped to a selected month (defaults to the current month): summary cards, charts, budgets, and the expense list
- Summary cards: today, this week, the selected month, overall budget, expenses logged
- "Review Miscellaneous" nudge when 3+ expenses and 20%+ of the month's entries are uncategorized — one click filters the list to them
- **Download Summary** per month as **CSV** or **PDF**: a bank-statement-style report with expenses grouped by category, a subtotal per category, and a month total

**Budgets**
- Optional budget per category or overall — persists until changed, no monthly reset
- Color-coded progress bars (green → yellow → red) with an over-budget callout
- Threshold alerts at 75%, 90%, and 100% — each fires once per scope per month (tracked in localStorage)

**Recurring items**
- A monthly checklist (rent, subscriptions, etc.) — an item shows "Logged ✓" once an expense with the same shop name exists in the selected month, otherwise "Log now" opens the expense modal pre-filled
- **Edit an amount two ways:** *only for this month* (a one-off override that disappears next month) or *from now on* (changes the base amount). A badge marks items with a this-month override

**Tabs**
- Overview (charts), Expenses, Budgets, Recurring, Yearly
- Yearly holds the GitHub-style contribution heatmap — spend per day across a selectable year, with a cursor-following tooltip and a click-through detail panel for each day

## Tech stack

- **MongoDB** — database
- **Express.js** — backend/API
- **React** (Vite) — frontend
- **Node.js** — server runtime
- **Tailwind CSS** (v4) — styling
- **Recharts** — donut + bar charts
- **Mongoose** — MongoDB ODM
- **Axios** — API client
- **React Router** — routing (single route today, structured for more)
- **react-datepicker** — calendar date picker
- **jsPDF + jspdf-autotable** — PDF statement generation (CSV is built by hand, no library)

## Frontend structure

```
frontend/src/
├── api/
│   ├── axiosClient.js        # shared axios instance, single base URL
│   ├── expenseApi.js
│   ├── categoryApi.js
│   ├── budgetApi.js
│   └── recurringApi.js
├── components/               # presentational — props in, callbacks out, no data fetching
│   ├── Toast.jsx
│   ├── ConfirmModal.jsx
│   ├── SummaryCards.jsx
│   ├── ExpenseForm.jsx
│   ├── ExpenseList.jsx
│   ├── BudgetPanel.jsx
│   ├── RecurringPanel.jsx
│   ├── RecurringEditModal.jsx
│   └── SpendHeatmap.jsx
├── utils/
│   ├── chartHelpers.js       # groups expenses for the donut/bar charts
│   ├── heatmapHelpers.js     # builds the calendar grid + intensity colors
│   ├── monthHelpers.js       # month keys, labels, today/this-week checks, alert tracking
│   └── summaryExport.js      # CSV + PDF statement generators
├── pages/
│   └── Dashboard.jsx         # owns all state + handlers, composes the components above
└── App.jsx                   # routing only
```

## Data model

**Expense**
```js
{
  amount: Number,          // required
  shopName: String,        // required
  category: ObjectId,      // optional, ref to Category — null is treated as Miscellaneous
  isMixed: Boolean,        // flagged if the expense covers multiple product types
  date: String,            // "YYYY-MM-DD", stored as a plain date string (see Key design decisions)
  notes: String,           // optional
}
```

**Category**
```js
{
  name: String,        // required, unique
  isDefault: Boolean,  // true for seeded categories, false for user-created ones
}
```

**Budget**
```js
{
  scope: String,   // a Category's ObjectId as a string, or the literal 'overall' (unique)
  limit: Number,
}
```

**RecurringItem**
```js
{
  name: String,                  // required
  amount: Number,                // required — the base amount, applies every month
  category: ObjectId,            // optional, ref to Category
  monthlyOverrides: Map<String, Number>,  // e.g. { "2026-10": 30 } — amount for that month only
}
```

## API routes

**Expenses** (`/api/expenses`)
- `GET /` — list all expenses (populated with category)
- `GET /summary/:month` — one month's expenses (`YYYY-MM`) grouped by category with totals; powers the CSV/PDF download
- `GET /:id` — get one expense
- `POST /` — create an expense
- `PUT /:id` — update an expense
- `DELETE /all` — delete every expense
- `DELETE /category/:categoryId` — delete every expense in a category
- `DELETE /:id` — delete one expense

**Categories** (`/api/categories`)
- `GET /` — list all categories
- `POST /` — create a new (user-defined) category; duplicate names return a clear error

**Budgets** (`/api/budgets`)
- `GET /` — list all budgets
- `GET /status` — live spend-vs-budget aggregation across all expenses (the UI now computes month-scoped status client-side from `GET /`, so this endpoint is currently unused by the frontend)
- `POST /` — create or update a budget for a scope (upsert)
- `DELETE /all` — remove every budget
- `DELETE /scope/:scope` — remove the budget for one scope
- `DELETE /:id` — remove a budget by id

**Recurring** (`/api/recurring`)
- `GET /` — list recurring items (populated with category)
- `POST /` — create a recurring item
- `PUT /:id` — change the amount: body `{ amount, scope: 'month' | 'forever', month }`
- `DELETE /:id/override/:month` — remove a one-month override so it falls back to the base amount
- `DELETE /:id` — delete a recurring item

> Route order matters in Express: specific paths (`/all`, `/category/:id`, `/scope/:scope`, `/summary/:month`, `/status`) are declared before the generic `/:id` on the same method, otherwise `/:id` swallows them and Mongoose fails casting `"all"` to an ObjectId.

## Key design decisions

- **`category` as `null`, not auto-assigned to Miscellaneous at save time** — keeps "user didn't pick one" distinguishable from "user explicitly picked Miscellaneous" in the data. The trade-off is that the fallback (`category?.name || 'Miscellaneous'`) must be applied *everywhere* the field is read — display, filtering (null matches the Miscellaneous filter), and the monthly summary. A filter that forgot the rule showed zero results for expenses that visibly said "Miscellaneous".
- **Budget `scope` as a plain string, not a strict ObjectId reference** — it needs to hold either a Category reference *or* the literal value `'overall'`, two different meanings in one field. Mongoose's `ref` expects a field to consistently point to one collection, so the mixed meaning is resolved in application code instead of the schema.
- **`upsert: true` on the budget POST route** — since budgets persist until explicitly changed, "set a budget" and "update a budget" are the same user action. One route handles both.
- **Derived data over stored data** — budget "spent" is computed from expenses on every read, and "is this recurring item logged this month" is matched by shop name against existing expenses rather than a stored flag. Nothing to drift out of sync. The aggregation endpoint requires casting the string `scope` to `mongoose.Types.ObjectId` explicitly, since `.aggregate()` (unlike `.find()`) doesn't auto-cast.
- **Recurring amounts: base value + sparse monthly overrides** — "this month only" writes one key into `monthlyOverrides`; the effective amount is `override ?? base`, computed on read. A permanent change is a single write and a one-off needs no cleanup next month, unlike copying a record per month.
- **Expense dates stored as plain `"YYYY-MM-DD"` strings, not full `Date`/timestamp values** — an earlier version stored real `Date` objects, which silently shifted by a day for any timezone ahead of UTC: `JSON.stringify` serializes a `Date` through UTC, so local midnight on the 7th could get stored as the 6th. Dates are built from local year/month/day parts on write and parsed manually (never `new Date("YYYY-MM-DD")`, which parses as UTC) on read.
- **Monthly summary grouped server-side, month-filtered in JS** — the endpoint returns ready-to-render groups so the CSV/PDF generators stay simple. Filtering happens in JavaScript after `find()` because dates were historically stored in more than one format; with a single clean format it would move into the query or an aggregation.
- **Client-side filtering/sorting of the expense list** — the full list is already in memory, so filtering and sorting happen with no network round-trip. A deliberate tradeoff that stops making sense at a scale (many thousands of expenses) this project won't realistically hit.
- **State lives in `Dashboard.jsx`; components are presentational** — "lifting state up": children receive values and callbacks as props and own no state or data fetching. Trade-off: heavy prop passing, in exchange for one place to look when something is wrong.
- **One form, two modes (create vs. edit), shown in a modal** — `editingId` decides whether submit calls `createExpense` or `updateExpense`, and opening the modal from "edit" or "Log now" pre-fills it, so editing a row far down the list no longer jumps the page.
- **Delete and update require confirmation; create does not** — deleting or overwriting data isn't easily undone, so both go through a confirm step. Adding is low-risk and reversible, so it stays a single action.
- **localStorage for UI preferences only, always in try/catch** — selected month, filter, sort, and which budget alerts already fired. Never for application data, and the app works if storage is unavailable.

## Status

- [x] Backend: Expense/Category/Budget/RecurringItem models + full CRUD — tested end to end
- [x] Frontend scaffolded (Vite + React + Tailwind + Axios + React Router)
- [x] Add/edit/delete expenses in a modal, with calendar date picker and mixed-products flag
- [x] Custom category creation, inline from the form
- [x] Budgets (per category or overall) with progress bars and 75/90/100% threshold alerts
- [x] Donut chart + bar chart + GitHub-style spend heatmap
- [x] Delete / update confirmation modals, toast notifications
- [x] Search, category filter, sort — with persisted preferences
- [x] Notes field
- [x] Bulk clear (all expenses, by category, all budgets, single budget)
- [x] Month selector (defaults to current month) applied across cards, charts, budgets, and the list
- [x] Today / this-week summary cards
- [x] Recurring checklist with "Log now"
- [x] Recurring edit: this month only vs. from now on
- [x] Review-Miscellaneous nudge
- [x] Quick-add button + keyboard shortcut
- [x] Dashboard split into components
- [x] Tabbed layout (Overview / Expenses / Budgets / Recurring / Yearly)
- [x] Monthly summary download (CSV + PDF)
- [x] Styling pass (dusty-pink accent theme, warm background, card layout)
- [ ] Category delete route + UI
- [ ] Deploy (MongoDB Atlas + hosted backend + hosted frontend)

## Setup

**Backend**
```bash
cd backend
npm install
# create a .env file with:
# MONGO_URI=mongodb://localhost:27017/expense-tracker
# PORT=5050
npm run dev
```

Seed default categories (one-time):
```bash
node seed.js
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` by default, calling the API at `http://localhost:5050/api`.

## Notes

- Port 5000 conflicts with macOS AirPlay Receiver (returns an empty 403) — this project defaults to `5050` instead.
- Tailwind v4 requires the `@tailwindcss/vite` plugin registered in `vite.config.js` — without it, `@import "tailwindcss"` in `index.css` is silently ignored and no utility classes apply.
- In `index.css`, any `@import` (e.g. Google Fonts) must come before all other rules, including `@import "tailwindcss"`, or PostCSS rejects the file.