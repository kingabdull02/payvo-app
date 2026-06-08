# Payvo

A simple budget and bill tracking app for people who want to know what they owe before the month hits.

Built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

---

## What it does

Payvo lets you add your monthly bills manually, see the total at a glance, and mark them as paid one by one. No bank connections, no automatic syncing — just a clean overview of your finances.

- Add fixed bills that repeat every month
- Add one-time bills when they come in
- See how much you have left to pay this month
- Get email reminders before due dates
- Browse previous months in read-only mode

---

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase (auth + database)
- Framer Motion
- Vercel (hosting)

---

## Getting started

```bash
git clone https://github.com/kingabdull02/payvo-app.git
cd payvo-app
npm install
npm run dev
```

Create a `.env` file in the root with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Status

MVP in development. Supabase integration coming soon.
