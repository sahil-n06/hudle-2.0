# hudle-2.0

Book sports venues online. Players find a court, turf or pool, pick a time and book it. Admins manage venues, time slots and bookings.

<p>
  <img src="screenshots/desktop-01-venues.png" alt="PlaySpot venue list" width="750"><br>
  <img src="screenshots/mobile-01-venues.png" alt="PlaySpot on mobile" width="210">
  <img src="screenshots/mobile-03-slot-selected-sticky.png" alt="Picking a time on mobile" width="210">
</p>

> 📝 **Reviewer?** Start with [NOTES.md](NOTES.md): what's done, what I fixed and what can be improved.

**Stack:** Next.js 15 + React 19 (`web/`) · Node.js + Express 5 (`api/`) · PostgreSQL

---

## Quick start (2 commands)

**You need:** Node.js 20+ and PostgreSQL running on port 5432 (user `postgres`, password `postgres`).

No Postgres? With Docker installed, run `npm run db:docker` to start one.

```bash
npm run setup   # installs everything, creates the databases, loads demo data
npm run dev     # starts the API and the website together
```

Then open:

| What        | URL                            | Login                               |
| ----------- | ------------------------------ | ----------------------------------- |
| Website     | http://localhost:3000          | none needed                         |
| Admin panel | http://localhost:3000/admin    | `admin@playspot.local` / `admin123` |
| API docs    | http://localhost:4000/api/docs |                                     |

Press **Ctrl + C** to stop everything.

`npm run setup` is safe to run again: it keeps your data. If something goes wrong, it says what to do. See also [Common problems](#common-problems).

---

## Try it out

**As a player**

1. Open a venue, pick a date and a free slot, then fill in name, email and phone.
2. You get a reference such as `PS-12AB34CD`. Your slot now shows **Your booking** on the venue page in this browser.
3. **Manage a booking:** open `/confirmation?ref=PS-…` (linked from the success screen) to view or cancel it.
4. **My bookings:** enter your email, then the 6-digit code to see and cancel all your bookings.

> 💡 **Local dev has no email server.** The 6-digit code appears on the page and in the `[api]` terminal output. Set `SMTP_URL` to send real emails.

**As an admin:** sign in at `/admin` to add, edit, hide or delete venues, manage time slots, and search or cancel bookings.

---

## Useful commands

Run these from the project root:

| Command                    | What it does                                                        |
| -------------------------- | ------------------------------------------------------------------- |
| `npm run setup`            | First-time setup (safe to re-run)                                   |
| `npm run setup -- --reset` | Setup and **wipe** data back to the demo venues                     |
| `npm run dev`              | Start API (:4000) and website (:3000)                               |
| `npm run seed`             | **Wipe** the database and reload demo data                          |
| `npm test`                 | Run API and website tests (uses the separate `venue_test` database) |
| `npm run lint`             | Lint both apps                                                      |
| `npm run db:docker`        | Start a Postgres 17 container on port 5432                          |

**Demo data:** 6 venues (Football, Badminton, Tennis, Cricket, Basketball, Swimming), with daily slots and the admin account. Seeding deletes all bookings, so never run it on real data.

---

## How customers access their bookings

Bookings contain names and phone numbers, so they are protected:

| To…                           | You need                                             |
| ----------------------------- | ---------------------------------------------------- |
| View or cancel one booking    | Its reference (`PS-…`), shown once after booking     |
| See all bookings for an email | A 6-digit code sent to that email (valid 10 minutes) |

- A correct code sets a 24-hour `httpOnly` cookie. The cookie only allows access to bookings for that email.
- Codes are single-use. A code stops working after 5 wrong tries.
- Code requests and reference lookups are rate-limited.
- In production, `SMTP_URL` is required. Without it, the API refuses to send codes.

---

## Common problems

| Problem                                    | Fix                                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `Could not connect to PostgreSQL`          | Start Postgres (`npm run db:docker`, or `brew services start postgresql@17`). Different login? Edit `DATABASE_URL` in `api/.env`.  |
| `Port 3000/4000 is already in use`         | PlaySpot is already running somewhere. Run `lsof -i :3000`, then `kill <PID>`.                                                     |
| `Cannot find module './NNN.js'` in browser | The `.next` cache is broken (usually from `npm run build` during `dev`). Stop dev, run `rm -rf web/.next`, then run `npm run dev`. |
| Website shows an error or no venues        | The API isn't running. Use `npm run dev` from the root so both start together.                                                     |
| Admin login fails                          | Run `npm run seed` to recreate the admin from `api/.env`.                                                                          |
| Where's my email code?                     | Locally, it's on the page and in the `[api]` terminal output.                                                                      |

---

## Configuration

`npm run setup` creates `api/.env` from `api/.env.example`. Locally, the defaults work as they are.

| Variable         | Default                                             | What it does                                                                    |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`   | `postgres://postgres:postgres@localhost:5432/venue` | Database connection                                                             |
| `ADMIN_EMAIL`    | `admin@playspot.local`                              | Admin login email                                                               |
| `ADMIN_PASSWORD` | `admin123`                                          | Admin password (min. 8 characters)                                              |
| `JWT_SECRET`     | `local-development-secret-change-in-production`     | Signs sessions. Use 32+ random chars in production                              |
| `SMTP_URL`       | _(empty)_                                           | e.g. `smtp://user:pass@smtp.example.com:587`. Empty prints codes to the console |
| `MAIL_FROM`      | `PlaySpot <no-reply@playspot.local>`                | Sender for code emails                                                          |
| `APP_TZ`         | `Asia/Kolkata`                                      | Timezone for "today" and past slots                                             |
| `PORT`           | `4000`                                              | API port                                                                        |
| `CORS_ORIGIN`    | `http://localhost:3000`                             | Website address allowed to call the API                                         |
| `COOKIE_SECURE`  | `false`                                             | `true` when served over HTTPS                                                   |
| `TRUST_PROXY`    | `false`                                             | `true` behind a reverse proxy                                                   |
| `LOG_LEVEL`      | `info`                                              | Log detail level                                                                |

The website needs no `.env` locally. It forwards `/api/*` to `API_URL` (default `http://localhost:4000`).

**Production checklist:** set a strong `ADMIN_PASSWORD` and `JWT_SECRET`, set `SMTP_URL`, and set `COOKIE_SECURE=true`. The API won't start in production with the default admin password or a `JWT_SECRET` under 32 characters. It does not reject the default `JWT_SECRET` itself, so replace it.

---

<details>
<summary><b>Manual setup (without the setup script)</b></summary>

```bash
createdb -U postgres venue
createdb -U postgres venue_test       # for tests

cd api && cp .env.example .env && npm install && npm run seed && npm run dev   # terminal 1
cd web && npm install && npm run dev                                           # terminal 2
```

</details>

<details>
<summary><b>Run everything in Docker</b></summary>

```bash
docker compose up --build
docker compose exec api npm run seed   # demo data
```

The API runs in production mode here. Set `JWT_SECRET`, `ADMIN_PASSWORD` and `SMTP_URL` in your shell first. Without SMTP, "My bookings" codes can't be sent.

</details>

---

## Project layout

```text
venue-booking/
├── package.json          root commands: setup, dev, test, seed
├── scripts/              setup.mjs and dev.mjs
├── api/                  Express API
│   ├── .env.example
│   └── src/
│       ├── routes/       HTTP endpoints (public + admin)
│       ├── services/     booking, slot, venue and customer-access logic
│       ├── db/           migrations (run automatically on start), seed
│       └── openapi.yaml  API spec, served at /api/docs
└── web/                  Next.js website
    └── src/
        ├── app/          pages: venues, bookings, confirmation, admin
        ├── components/   UI components
        └── lib/          API client and helpers
```

## API at a glance

Full interactive docs: **http://localhost:4000/api/docs**

| Method | Endpoint                                       | Purpose                                                       |
| ------ | ---------------------------------------------- | ------------------------------------------------------------- |
| GET    | `/api/venues?q=&sport=&city=`                  | List venues                                                   |
| GET    | `/api/venues/:id/slots?date=YYYY-MM-DD`        | Free and booked slots for a day                               |
| POST   | `/api/bookings`                                | Create a booking                                              |
| GET    | `/api/bookings/confirmation/:reference`        | View a booking by reference                                   |
| POST   | `/api/bookings/confirmation/:reference/cancel` | Cancel a booking by reference                                 |
| POST   | `/api/bookings/access`                         | Email a 6-digit code (`{ email }`)                            |
| POST   | `/api/bookings/access/verify`                  | Check the code (`{ email, code }`) and set the session cookie |
| GET    | `/api/bookings`                                | Bookings for the verified email (needs the cookie)            |
| POST   | `/api/bookings/:id/cancel`                     | Cancel one of your bookings (needs the cookie)                |

Admin endpoints are under `/api/admin`. Sign in with `POST /api/admin/login`; it sets a session cookie.

## Good to know

- **No double booking.** A database rule rejects overlapping bookings, even when two people book at the same moment.
- **Migrations run automatically** when the API starts.
- **Not included:** payments and player accounts. Customers use a booking reference or an email code.
- Don't run `npm run build` in `web/` while `npm run dev` is running. It breaks the dev cache (see Common problems).
