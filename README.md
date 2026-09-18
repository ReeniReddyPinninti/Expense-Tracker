# Expense Tracker

A MERN-stack expense tracker with manual entry, custom categories, optional budgets, and an interactive dashboard — built as a personal project to actually understand the full stack end to end, not just to ship a finished app.

## What it does

- Add, edit, or delete an expense: amount, shop name, category (optional), date (calendar picker), optional notes, optional "mixed products" flag
- No category selected → defaults to **Miscellaneous**; checking "mix of different products" auto-suggests Miscellaneous too, but can be overridden
- Pick from default categories (Food, Rent, Transport, Shopping, Entertainment, Utilities, Miscellaneous) or create your own — custom categories persist and show up as options going forward
- Set an optional budget per category or overall — budgets persist until changed, no monthly reset — shown as color-coded progress bars (green → yellow → red) with an "over budget" callout
- Search expenses by shop name and filter by category, live as you type
- Sort the expense list (newest/oldest, amount high↔low, shop name A–Z)
- Delete and update both require a confirmation step before committing
- Toast notifications confirm actions (expense added/updated/deleted, budget updated, category created)
- Dashboard visualizations:
  - Donut chart — spend by category
  - Bar chart — spend by date
  - GitHub-style contribution heatmap — spend per day across a selectable year, with a cursor-following tooltip on hover and a click-through detail panel showing that day's expenses

## Tech stack

- **MongoDB** — database
- **Express.js** — backend/API
- **React** (Vite) — frontend
- **Node.js** — server runtime
- **Tailwind CSS** — styling
- **Recharts** — donut + bar charts
- **Mongoose** — MongoDB ODM
- **Axios** — API client
- **React Router** — routing (single route today, structured for more)
- **react-datepicker** — calendar date picker

## Frontend structure

```
frontend/src/
├── api/
│   ├── axiosClient.js      # shared axios instance, single base URL
│   ├── expenseApi.js
│   ├── categoryApi.js
│   └── budgetApi.js
├── components/
│   ├── Toast.jsx
│   └── SpendHeatmap.jsx
├── utils/
│   ├── chartHelpers.js     # groups expenses for the donut/bar charts
│   └── heatmapHelpers.js   # builds the calendar grid + intensity colors
├── pages/
│   └── Dashboard.jsx       # main view: form, budgets, charts, list
└── App.jsx                 # routing only
```

## Data model

**Expense**
```js
{
  amount: Number,          // required
  shopName: String,        // required
  category: ObjectId,      // optional, ref to Category — null defaults to Miscellaneous at display time
  isMixed: Boolean,        // flagged if the expense covers multiple product types
  date: String,            // "YYYY-MM-DD", stored as a plain date string (see Key design decisions)
  notes: String,           // optional
}
```

**Category**
```js
{
  name: String,       // required, unique
  isDefault: Boolean,  // true for seeded categories, false for user-created ones
}
```

**Budget**
```js
{
  scope: String,   // a Category's ObjectId as a string, or the literal 'overall'
  limit: Number,
}
```

## API routes

**Expenses** (`/api/expenses`)
- `GET /` — list all expenses (populated with category)
- `GET /:id` — get one expense
- `POST /` — create an expense
- `PUT /:id` — update an expense
- `DELETE /:id` — delete an expense

**Categories** (`/api/categories`)
- `GET /` — list all categories
- `POST /` — create a new (user-defined) category

**Budgets** (`/api/budgets`)
- `GET /` — list all budgets
- `POST /` — create or update a budget for a scope (upsert)
- `DELETE /:id` — remove a budget
- `GET /status` — live spend-vs-budget calculation per scope (aggregated from expenses, not stored)

## Key design decisions

- **`category` as `null`, not auto-assigned to Miscellaneous at save time** — keeps "user didn't pick one" distinguishable from "user explicitly picked Miscellaneous" in the data, with the fallback (`category?.name || 'Miscellaneous'`) handled at display time instead.
- **Budget `scope` as a plain string, not a strict ObjectId reference** — it needs to hold either a Category reference *or* the literal value `'overall'`, two different meanings in one field. Mongoose's `ref` expects a field to consistently point to one collection, so the mixed meaning is resolved in application code instead of the schema.
- **`upsert: true` on the budget POST route** — since budgets persist until explicitly changed, "set a budget" and "update a budget" are the same user action. One route handles both.
- **Spend vs. budget calculated live via aggregation, not stored as a running total** — avoids drift between a stored number and actual expense data. Requires casting the string `scope` to `mongoose.Types.ObjectId` explicitly before matching, since `.aggregate()` (unlike `.find()`) doesn't auto-cast query values to schema types.
- **Expense dates stored as plain `"YYYY-MM-DD"` strings, not full `Date`/timestamp values** — an earlier version stored real `Date` objects, which silently shifted by a day for any timezone ahead of UTC: `JSON.stringify` serializes a `Date` through UTC, so local midnight on the 7th could get stored as the 6th. Storing (and reading) a plain date string built from local `year/month/day` parts everywhere — write, edit, and display — avoids the conversion entirely, since an expense's date never needs time-of-day precision.
- **Client-side filtering/sorting of the expense list** — the full list is already in memory, so filtering and sorting happen in the component with no extra network round-trip. A deliberate tradeoff that stops making sense at a scale (many thousands of expenses) this project won't realistically hit.
- **One form, two modes (create vs. edit)** — `editingId` state determines whether submitting calls `createExpense` or `updateExpense`, rather than maintaining a separate edit form/modal.
- **Delete and update require confirmation; create does not** — deleting or overwriting existing data isn't easily undone, so both go through a confirm step. Adding a new expense is low-risk and reversible (just delete it), so it stays a single action.

## Status

- [x] Backend: Expense/Category/Budget models + full CRUD + live budget-status aggregation — tested end to end
- [x] Frontend scaffolded (Vite + React + Tailwind + Axios + React Router)
- [x] Add/edit/delete expenses, with calendar date picker and mixed-products flag
- [x] Custom category creation, inline from the form
- [x] Budget setting (per category or overall) with color-coded progress bars
- [x] Donut chart (spend by category) + bar chart (spend by date)
- [x] GitHub-style spend heatmap with hover tooltip and click-through day detail
- [x] Delete confirmation modal
- [x] Update confirmation modal
- [x] Search + category filter on the expense list
- [x] Sort options (date, amount, shop name)
- [x] Toast notifications for add/update/delete/budget/category actions
- [x] Notes field
- [x] Styling pass (dusty-pink accent theme, warm background, card layout)
- [ ] Deploy

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