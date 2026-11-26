# MANAGE YOUR INVENTORY

A full-stack inventory management application built with React, Express, and SQLite.

## Setup

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

Open http://localhost:3000. The default initial administrator is `admin` / `Admin@123` unless overridden in `.env`.

Set a strong `SESSION_SECRET` and change the administrator password for real use. Seed data is created only when the database is empty.

## Scripts

- `npm.cmd run dev` - builds the React frontend and starts the Express server
- `npm.cmd run build` - builds the frontend
- `npm.cmd start` - starts the server using an existing `dist` build

Environment variables:

- `PORT`
- `DB_PATH`
- `SESSION_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

Inventory turnover is documented in the reports interface as outbound quantity divided by average inventory for the selected period. Historical sales revenue is not inferred from stock movements.
