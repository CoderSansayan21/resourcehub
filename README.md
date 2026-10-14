# ResourceHub

ResourceHub is a Next.js App Router internship assessment project for browsing,
administering, and booking shared workplace resources.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local PostgreSQL database. One common `psql` flow is:

```bash
createdb resourcehub
```

If your local PostgreSQL installation requires an explicit user, create the
database with the user your connection string will use:

```bash
createdb -U postgres resourcehub
```

Copy the environment template and fill in local values:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your local database. Do not commit real secrets.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/resourcehub?schema=public"
BETTER_AUTH_SECRET="replace-with-a-random-32-byte-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Seed assessment sample resources:

```bash
npm run db:seed
```

Start the application:

```bash
npm run dev
```

Open http://localhost:3000.

## Seed Data

The seed script is intended for local development and assessment demonstration
only. It refuses to run when production environment flags are present, requires a
valid `DATABASE_URL`, and does not log credentials.

The seed creates these active resources when they do not already exist:

| Category | Resource | Capacity |
| --- | --- | --- |
| Meeting Rooms | Conference Room A | 12 |
| Meeting Rooms | Boardroom B | 20 |
| Equipment | Projector 01 | 1 |
| Equipment | Video Conference Kit | 1 |
| Workspaces | Focus Desk 01 | 1 |
| Workspaces | Collaboration Area | 8 |
| Computer Labs | Training Lab A | 24 |
| Others | Photography Studio | 6 |

The existing `Resource` model has no dedicated seed identifier or uniqueness
constraint for sample data. To stay safe, the seed uses a normalized resource
name duplicate check and only creates missing samples. Existing resources with
matching names are skipped and never overwritten, so ADMIN edits are preserved.
The seed does not delete resources, modify users, reset passwords, create
reservations, or change booking logic.

## Reviewer Flow

1. Run migrations and `npm run db:seed`.
2. Start the app with `npm run dev`.
3. Register or sign in.
4. Browse the seeded active resources from the member resource catalog.
5. Open a resource detail page, choose an available time, and book it.
6. Use an ADMIN account to manage resource visibility and inspect reservations.

## Useful Commands

```bash
npx prisma validate
npm run lint
npm run build
npm run db:seed
```
