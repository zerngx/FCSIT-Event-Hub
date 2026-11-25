# FCSIT Event Hub System

WIA2006 Systems Analysis, Modelling and Design, Group Suibian (OCC 3, Universiti Malaya, session 2026/2027).

A mobile-responsive web platform for FCSIT events: discover events, register or apply, get a personal rotating QR ticket, and check in at the door.

## Repository layout

| Folder | Contents |
|---|---|
| `web/` | Next.js (React + Node.js) app, the prototype |
| `supabase/` | PostgreSQL schema migrations and demo seed data |
| `diagrams/` | draw.io source files: FDDs, context diagram, Level-0 DFD, ERD, use case diagram |
| `docs/` | Data dictionary and other report material |

## Run the prototype

```powershell
cd web
copy .env.example .env.local   # then fill in the two Supabase values
npm install
npm run dev
```

Open http://localhost:3000. The database lives in the Supabase project `fcsit-event-hub`; apply `supabase/migrations/*.sql` in order to a fresh project, then `supabase/seed.sql` for demo events.

For local demos, switch off "Confirm email" in Supabase (Authentication > Providers > Email) so new accounts can sign in immediately.

## Status

Iteration 1 (MVP, due 13 Dec 2026) is built: sign-up and sign-in, organiser requests and admin approval, event creation and publishing, registration with seat control and waitlist, rotating 30-second QR ticket, organiser scanner with duplicate and expiry checks, attendance list and CSV export.

Not built yet (iteration 2): resume screening, waitlist promotion on cancel, notifications, certificates, profile photo and matric number editing.

## Demo roles

Accounts are created through the sign-up page. To make an admin, run in the Supabase SQL editor: `update public.users set role = 'admin' where email = '<your email>';`. Students then request organiser access from the Events page and the admin approves them at `/admin`.
