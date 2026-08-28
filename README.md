# Expense Tracker

A MERN-stack expense tracker with manual entry, custom categories, optional budgets, and an interactive dashboard. Built as a personal project to actually understand the full stack end to end — not just to ship a finished app.

## What it does

- Add an expense: amount, shop name, category (optional), date (calendar picker), optional notes
- No category selected → defaults to **Miscellaneous**; expenses covering multiple products can be flagged as mixed
- Pick from default categories (Food, Rent, Transport, Shopping, Entertainment, Utilities, Miscellaneous) or create your own — custom categories persist and show up as options going forward
- Set an optional budget per category or overall — budgets persist until changed, no monthly reset
- Dashboard shows spend by category (donut chart), spend over time (bar chart), and budget progress bars with color-coded status (green → yellow → red)

## Tech stack

- **MongoDB** — database
- **Express.js** — backend/API
- **React** — frontend
- **Node.js** — server runtime
- **Tailwind CSS** — styling
- **Recharts** — charts (donut + bar)
- **Mongoose** — MongoDB ODM

## Data model

**Expense**
```js
{
  amount: Number,          // required
  shopName: String,        // required
  category: ObjectId,      // optional, ref to Category — null defaults to Miscellaneous at display time
  isMixed: Boolean,        // flagged if the expense covers multiple product types
  date: Date,              // required, via calendar picker
  notes: String,           // optional
}
```

**Category**
```js
{
  name: String,      // required, unique
  isDefault: Boolean, // true for seeded categories, false for user-created ones
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

- **`category` as `null`, not auto-assigned to Miscellaneous at save time** — keeps "user didn't pick one" distinguishable from "user explicitly picked Miscellaneous" in the data, with the fallback (`category?.name || 'Miscellaneous'`) handled at display time instead. Simpler to store, one line to resolve.
- **Budget `scope` as a plain string, not a strict ObjectId reference** — it needs to hold either a Category reference *or* the literal value `'overall'`, two different meanings in one field. Mongoose's `ref` expects a field to consistently point to one collection, so the mixed meaning is resolved in application code instead of the schema.
- **`upsert: true` on the budget POST route** — since budgets persist until explicitly changed, "set a budget" and "update a budget" are the same user action. One route handles both, so the frontend doesn't need to check whether a budget already exists first.
- **Spend vs. budget calculated live via aggregation, not stored as a running total** — avoids the running total ever drifting out of sync with actual expense data (a risk if every add/edit/delete had to remember to update a separate stored number). Trades a bit of per-request computation for a correctness guarantee, which is the right tradeoff at this scale — a good example of preferring derived data over stored data unless there's a measured performance reason not to.

## Status

- [x] Backend scaffolded (Express + MongoDB connection)
- [x] Expense model + full CRUD routes
- [x] Category model + seeding default categories + create-new route
- [x] Expense → Category reference (nullable, defaults to Miscellaneous at display time)
- [x] Budget model + routes (create/update via upsert, delete)
- [x] Live budget-status aggregation endpoint
- [ ] Verify budget-status endpoint end-to-end (in progress)
- [ ] React frontend: expense list + add-expense form
- [ ] React frontend: category selection/creation UI
- [ ] React frontend: budget setting UI
- [ ] Dashboard: donut chart (spend by category)
- [ ] Dashboard: bar chart (spend over time)
- [ ] Dashboard: budget progress bars
- [ ] Styling pass (light dusty-pink accent theme)
- [ ] Deploy

## Setup

```bash
# backend
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

Frontend setup — to be added once the React app is scaffolded.

## Notes

- Port 5000 conflicts with macOS AirPlay Receiver (returns an empty 403) — this project defaults to `5050` instead.