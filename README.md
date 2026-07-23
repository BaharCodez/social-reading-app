# The Same Page

A social reading app — read EPUBs together, highlight passages, annotate, and share notes with friends. Installable as a PWA.

## Tech Stack

### Framework & Language

- **[Next.js](https://nextjs.org) 16** (App Router) — React framework, server components, route handlers
- **[React](https://react.dev) 19** + **React DOM 19**
- **[TypeScript](https://www.typescriptlang.org) 5** (target ES2017)
- **Node.js** runtime

### Styling

- **[Tailwind CSS](https://tailwindcss.com) 4** (via `@tailwindcss/postcss`)
- **PostCSS**
- `prettier-plugin-tailwindcss` for class sorting

### Database & ORM

- **[PostgreSQL](https://www.postgresql.org)** — primary datastore (`pg` driver + `@prisma/adapter-pg`)
- **[Prisma](https://www.prisma.io) 7** — ORM and migrations (generated client output to `app/generated/prisma`)
- Models: `User`, `Account`, `Session`, `VerificationToken`, `Book`, `Annotation`, `ReadingProgress`

### Authentication

- **[Auth.js / NextAuth.js](https://authjs.dev) 5 (beta)** with the **Prisma adapter** (`@auth/prisma-adapter`)
- Providers: **Google OAuth** and **Credentials** (email/password)
- **bcryptjs** for password hashing; JWT sessions for credentials sign-in

### Reading / EPUB

- **[epub.js](https://github.com/futurepress/epub.js)** — EPUB parsing and rendering (per-chapter scrolled view, custom themes)

### Validation

- **[Zod](https://zod.dev) 4** — schema validation for forms and API input

### PWA

- Web app manifest (`app/manifest.ts`) — standalone install, custom icons, theming

### Tooling

- **ESLint 9** (`eslint-config-next`, `eslint-config-prettier`)
- **Prettier 3**
- **dotenv** for local environment configuration

## Getting Started

Install dependencies and set up the database:

```bash
npm install
npx prisma migrate dev   # apply migrations to your Postgres database
```

Set the required environment variables (e.g. in `.env`):

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the dev server                 |
| `npm run build`        | `prisma generate` + production build |
| `npm run start`        | Start the production server          |
| `npm run lint`         | Run ESLint                           |
| `npm run format`       | Format with Prettier                 |
| `npm run format:check` | Check formatting                     |

## Deployment

Target deployment is **Vercel** (Next.js host) with **Neon** for managed Postgres.
