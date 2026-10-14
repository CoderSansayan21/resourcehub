# ResourceHub

ResourceHub is a full-stack Resource Reservation Management System built as a PrimeWave Lab (Pvt) Ltd internship assessment. It helps members discover shared workplace resources, check real availability, create reservations, and avoid booking conflicts while giving administrators controlled tools for resource and reservation management.

## Project Overview

Shared workplace resources such as meeting rooms, equipment, workspaces, computer labs, and special-purpose facilities can become difficult to manage when availability is unclear or overlapping bookings are allowed. ResourceHub addresses this by combining authenticated member access, an admin-managed resource inventory, reservation validation, availability timelines, PostgreSQL persistence, and server-side authorization.

The application is designed to be runnable locally by reviewers and to demonstrate practical full-stack engineering decisions: App Router routing, database-backed workflows, role-based access control, safe seed data, and booking conflict prevention.

## Assessment Requirements & Implementation

| Assessment Requirement | ResourceHub Implementation |
| --- | --- |
| Functional full-stack web application | Implemented as a Next.js App Router application with authenticated pages, API route handlers, PostgreSQL persistence, and interactive React UI. |
| Next.js App Router | Uses `src/app` route groups, App Router layouts, server pages, route handlers, and file-based metadata conventions. |
| TypeScript | Application code, Prisma integration, server utilities, and UI components are written in TypeScript. |
| PostgreSQL with persistent storage | Uses PostgreSQL through Prisma 7 and `@prisma/adapter-pg`; schema and migrations are stored under `prisma/`. |
| Git and GitHub | Repository remote: `https://github.com/CoderSansayan21/resourcehub.git`. |
| Locally runnable application | Setup steps are documented in this README using `npm install`, Prisma migrations, seed data, and `npm run dev`. |
| Clear README explaining setup | This README documents setup, features, architecture, database design, workflows, and verification. |
| Shareable database ER diagram | **ER Diagram:** [View ER diagram](https://drive.google.com/file/d/1xWF8MfT8sVZH_sXHjydeC-eyrIb1932t/view?usp=sharing) |
| 3-5 minute screen-recorded demonstration | **Demo Video:** [Watch demo video](https://drive.google.com/file/d/1NAMySMuUgfRetdrQ3tTZsq3g0NLo2E-O/view?usp=sharing) |
| GitHub repository submission | Source repository URL is listed above; final submission should include the GitHub repository, ER diagram, and demo video links. |

## Key Features

### Member Features

- Email and password authentication through Better Auth.
- MEMBER role assigned by default during registration.
- Member dashboard with access to resources, reservations, and availability.
- Resource catalog showing active resources only.
- Resource category browsing for Meeting Rooms, Equipment, Workspaces, Computer Labs, and Others.
- Resource search and filtering by category.
- Resource detail page with location, capacity, description, and booking entry point.
- Reservation creation for active resources.
- Reservation form validation for required title, start/end time order, future start time, maximum 8-hour duration, and optional notes.
- Member reservation history with confirmed/cancelled status and upcoming/ongoing/past temporal labels.
- Member reservation details, rescheduling of eligible owned future reservations, and cancellation of eligible owned future reservations.
- Availability page showing occupied and free intervals for a selected resource and date.

### Admin Features

- ADMIN-only dashboard and management pages protected by server-side role checks.
- Resource inventory management across active and inactive resources.
- Resource creation and editing for name, category/type, location, capacity, and description.
- Resource activation and deactivation; deactivation hides resources from members while preserving records.
- Resource search and filters by status and type.
- Reservation management view across all members.
- Reservation search by title, resource, member, type, or location.
- Summary counts for total, upcoming, ongoing, past, and cancelled reservations.
- Member identity display in reservation records using member name and email rather than raw UUIDs.
- Admin reservation detail view.
- Admin cancellation of eligible future confirmed reservations with a confirmation dialog.

### Booking & Availability Rules

- Reservation timestamps are stored as PostgreSQL `timestamptz` values.
- Reservation creation requires authentication and an active resource.
- Members can list, inspect, update, and cancel only their own reservations.
- Admins can list and inspect all reservations and cancel any eligible future confirmed reservation.
- Cancellation updates reservation status to `CANCELLED`; records are not deleted.
- Cancelled reservations no longer block availability.
- Booking overlap checks use the same interval rule throughout the app: an overlap exists when an existing confirmed booking has `endTime > requestedStart` and `startTime < requestedEnd`.
- PostgreSQL enforces confirmed booking integrity with the `Reservation_no_confirmed_overlap` GiST exclusion constraint.
- PostgreSQL also enforces `startTime < endTime` with the `Reservation_start_before_end` check constraint.
- Availability calculates day boundaries using the selected IANA timezone and the application currently uses `Asia/Colombo` for the availability timeline.
- Availability clips reservations that cross midnight to the selected day and shows free intervals before, between, and after occupied blocks.
- Booking status (`CONFIRMED` or `CANCELLED`) is kept separate from temporal display labels (`Upcoming`, `Ongoing`, `Past`).

## Technology Stack

| Technology | Role |
| --- | --- |
| Next.js 16.4.0 App Router | Routing, layouts, server-rendered pages, route handlers, metadata, and production build. |
| React 19.3.0 | Client-side interactive components for forms, tables, dialogs, and filters. |
| TypeScript 5 | Type safety across application code, API logic, and shared utilities. |
| Tailwind CSS 4 | Utility-first styling for the ResourceHub UI. |
| PostgreSQL | Persistent relational database for users, resources, reservations, sessions, and auth records. |
| Prisma 7.10.0 | ORM, generated client, schema management, migrations, and database access. |
| `@prisma/adapter-pg` | Prisma 7 PostgreSQL adapter used by the application and seed script. |
| Better Auth 1.7.7 | Email/password authentication, sessions, and user account storage. |
| `@better-auth/prisma-adapter` | Better Auth integration with Prisma/PostgreSQL. |
| lucide-react | Icon library used throughout the UI. |
| jiti | Executes the TypeScript/ESM seed script through `npm run db:seed`. |

## Application Architecture

ResourceHub uses a split between server-trusted data access and client-side interactivity:

- App Router pages in `src/app` load protected screens and pass initial data to interactive components.
- Route handlers under `src/app/api` expose authenticated resource, reservation, availability, and Better Auth endpoints.
- Server utilities in `src/lib` centralize Prisma access, authentication, authorization, resource validation, reservation rules, availability calculations, and dashboard data.
- Client components in `src/components` handle forms, filters, dialogs, status displays, and refresh behavior.
- Prisma migrations define database tables, relationships, indexes, and reservation overlap protection.

```text
src/
  app/
    layout.tsx
    page.tsx
    login/page.tsx
    register/page.tsx
    (dashboard)/
      dashboard/page.tsx
      resources/page.tsx
      resources/[id]/page.tsx
      availability/page.tsx
      reservations/page.tsx
      admin/page.tsx
    api/
      auth/[...all]/route.ts
      resources/
      reservations/
      availability/
  components/
    admin/
    auth/
    layout/
    ui/
    availability-timeline.tsx
    reservation-booking-form.tsx
    reservation-manager.tsx
    resource-catalog.tsx
  generated/prisma/
  lib/
prisma/
  schema.prisma
  migrations/
scripts/
  seed.mts
  promote-admin.mts
  *-smoke-test.mjs
public/
```

## Database Design

The Prisma schema defines these main entities:

| Entity | Purpose |
| --- | --- |
| `User` | Application users with `ADMIN` or `MEMBER` role, unique email, profile fields, and relations to sessions, accounts, and reservations. |
| `Resource` | Reservable workplace item or space with name, type/category, description, location, capacity, active state, and reservations. |
| `Reservation` | Booking record linking a user to a resource with title, start/end timestamps, status, notes, and audit timestamps. |
| `Session` | Better Auth session records linked to users. |
| `Account` | Better Auth account records, including email/password provider data. |
| `Verification` | Better Auth verification records. |

Important database rules:

- `User.email` is unique.
- `Reservation.userId` references `User.id`.
- `Reservation.resourceId` references `Resource.id`.
- Reservation timestamps use PostgreSQL `timestamptz`.
- Reservation indexes support user history, resource timelines, status filtering, and overlap queries.
- Migration `20261012171000_add_reservation_overlap_constraints` adds `btree_gist`, a `Reservation_start_before_end` check constraint, and a `Reservation_no_confirmed_overlap` exclusion constraint for `CONFIRMED` reservations.

**ER Diagram:** [View ER diagram](https://drive.google.com/file/d/1xWF8MfT8sVZH_sXHjydeC-eyrIb1932t/view?usp=sharing)

## Getting Started / Local Setup

### Prerequisites

- Node.js 20 or newer. Node.js 24 was used during local verification.
- npm.
- PostgreSQL installed and running locally.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/CoderSansayan21/resourcehub.git
cd resourcehub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a PostgreSQL Database

One common local flow is:

```bash
createdb resourcehub
```

If your PostgreSQL installation requires an explicit user:

```bash
createdb -U postgres resourcehub
```

### 4. Configure Environment Variables

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Then edit `.env` with local values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/resourcehub?schema=public"
BETTER_AUTH_SECRET="replace-with-a-random-32-byte-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

Use a real local PostgreSQL username/password and a strong local `BETTER_AUTH_SECRET`. Do not commit `.env` or real secrets.

### 5. Apply Prisma Migrations

```bash
npx prisma migrate deploy
```

For local development where you are intentionally creating or changing migrations, use Prisma's development workflow separately. Reviewers should be able to apply the existing migrations with the command above.

### 6. Seed Sample Resources

```bash
npm run db:seed
```

### 7. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 8. Create a Local ADMIN Account for Review

Public registration always creates a MEMBER account. To review ADMIN features locally:

1. Open `http://localhost:3000/register`.
2. Register a normal MEMBER account using the email address you want to use as the reviewer/admin account.
3. Stop the app if you prefer to avoid multiple active database connections. This is optional for most local PostgreSQL setups, but safe for review.
4. From the project root, run:

```bash
npm run admin:promote -- reviewer@example.com
```

Replace `reviewer@example.com` with the exact email used during registration. Review the displayed target user, then type the exact confirmation phrase shown by the CLI, for example:

```text
PROMOTE reviewer@example.com
```

The command promotes that existing `MEMBER` user to `ADMIN` in the local PostgreSQL database. It refuses production environment flags, does not create a password, expose admin registration, change existing ADMIN accounts, change other users, or modify reservations.

After promotion, start the app again if you stopped it, then sign out and sign back in with the same email/password. Open:

```text
http://localhost:3000/admin
```

## Authentication & User Roles

ResourceHub uses Better Auth email/password authentication.

| Role | Permissions |
| --- | --- |
| MEMBER | Browse active resources, view resource details, check availability, create reservations, view own reservation history, reschedule eligible owned future reservations, and cancel eligible owned future reservations. |
| ADMIN | Access admin dashboard, manage resources, view all reservations, inspect member reservation details, and cancel eligible future confirmed reservations. |

Public registration creates MEMBER accounts only. The code intentionally sets new users to `MEMBER` and does not expose public ADMIN registration.

For local assessment review, a trusted developer can promote an existing registered MEMBER account with:

```bash
npm run admin:promote -- reviewer@example.com
```

The promotion command uses the existing Prisma/PostgreSQL setup, requires `DATABASE_URL`, refuses production environment flags, updates only the matching user's role, and leaves bookings unchanged.

## Sample Data

The seed script creates these active sample resources when they do not already exist:

| Category | Stored Type | Resource | Capacity |
| --- | --- | --- | --- |
| Meeting Rooms | `meeting-rooms` | Conference Room A | 12 |
| Meeting Rooms | `meeting-rooms` | Boardroom B | 20 |
| Equipment | `equipment` | Projector 01 | 1 |
| Equipment | `equipment` | Video Conference Kit | 1 |
| Workspaces | `workspaces` | Focus Desk 01 | 1 |
| Workspaces | `workspaces` | Collaboration Area | 8 |
| Computer Labs | `computer-labs` | Training Lab A | 24 |
| Others | `others` | Photography Studio | 6 |

The seed is intended for local development and assessment demonstration. It requires a valid `DATABASE_URL`, refuses production environment flags, uses the project's Prisma 7 PostgreSQL adapter, and disconnects the Prisma Client when finished.

The existing schema does not include a dedicated seed identifier, so the seed uses a normalized resource name duplicate check. It creates missing sample resources only, skips existing resources with matching names, does not overwrite ADMIN edits, and does not modify users or reservations.

## Core Workflows

1. A member registers or signs in.
2. The member opens the resource catalog and filters by category or search term.
3. The member opens a resource detail page and reviews capacity, location, and description.
4. The member checks the availability timeline for a resource and date.
5. The member creates a reservation with a title, start time, end time, and optional notes.
6. The server validates authentication, active resource state, date/time rules, and booking conflicts.
7. PostgreSQL rejects any concurrent confirmed overlap that passes the initial application check.
8. The member views confirmed, cancelled, upcoming, ongoing, and past reservations in reservation history.
9. An admin views all reservations with member name/email and resource details.
10. An admin cancels an eligible future confirmed reservation after confirming the warning dialog.
11. The cancelled reservation remains in history as `CANCELLED` and its time slot becomes available for new bookings.

## Validation & Testing

Useful verification commands:

```bash
npx prisma validate
npm run lint
npm run build
```

Additional smoke-test scripts are available under `scripts/`. They are designed for local verification against a configured database and, where applicable, a running app with matching `BETTER_AUTH_URL`:

```bash
node scripts/availability-booking-integration-check.mjs
node scripts/availability-smoke-test.mjs
node scripts/reservation-smoke-test.mjs
node scripts/resource-smoke-test.mjs
node scripts/reservation-concurrency-smoke-test.mjs
node scripts/dashboard-smoke-test.mjs
node scripts/authz-smoke-test.mjs
```

Manual reviewer checklist:

- Register/sign in as a MEMBER.
- Confirm protected dashboard routes require authentication.
- Browse active resources and filter by category.
- Check resource availability for a date in the availability page.
- Create a valid reservation.
- Attempt an overlapping reservation and confirm it is rejected.
- Confirm the same booking interval appears consistently in reservations and availability.
- Cancel an eligible member reservation and confirm the record remains cancelled.
- Confirm the cancelled booking no longer blocks availability.
- Verify ADMIN routes are inaccessible to MEMBER accounts.
- With an ADMIN account, create/edit/deactivate/reactivate resources.
- With an ADMIN account, view all reservations and confirm member name/email appears in the Booked By column.
- With an ADMIN account, cancel an eligible member reservation only after confirming the dialog.

## Engineering Decisions

- **PostgreSQL persistence:** the assessment requires durable storage, so users, resources, reservations, sessions, and auth data are stored relationally.
- **Prisma 7 with PostgreSQL adapter:** database access is centralized through the generated Prisma client and `@prisma/adapter-pg`, matching the current Prisma adapter model.
- **Server-side authorization:** role checks are performed in server utilities and route handlers; UI visibility is treated as convenience, not security.
- **Database-backed conflict prevention:** the application performs friendly overlap checks, while PostgreSQL provides the final concurrency-safe guarantee for confirmed reservations.
- **Status-preserving cancellation:** cancellations update status to `CANCELLED` instead of deleting records, preserving audit/history while releasing availability.
- **Timezone consistency:** availability uses `Asia/Colombo` day boundaries and IANA timezone handling so Sri Lanka booking dates display consistently.
- **Safe seed design:** sample data is idempotent, non-destructive, refuses production, and avoids modifying users or reservations.
- **Scope discipline:** ResourceHub implements practical reservation management without claiming unrelated workflows such as approval queues, payments, or resource deletion.

## Demo Video

**Demo Video (3-5 minutes):** [Watch demo video](https://drive.google.com/file/d/1NAMySMuUgfRetdrQ3tTZsq3g0NLo2E-O/view?usp=sharing)

Suggested demo flow:

1. Explain the workplace resource reservation problem.
2. Register/sign in as a member and browse seeded resources.
3. Check availability and create a reservation.
4. Demonstrate overlap rejection.
5. Show member reservation history and cancellation.
6. Switch to an admin account, manage resources, view member reservations, and cancel an eligible booking.
7. Briefly explain PostgreSQL overlap protection, role-based authorization, and safe seed data.

## Submission

Final assessment submission should include:

- GitHub source repository: `https://github.com/CoderSansayan21/resourcehub.git`
- Setup README: this file.
- Shareable ER diagram URL: `https://drive.google.com/file/d/1xWF8MfT8sVZH_sXHjydeC-eyrIb1932t/view?usp=sharing`
- 3-5 minute demo video URL: `https://drive.google.com/file/d/1NAMySMuUgfRetdrQ3tTZsq3g0NLo2E-O/view?usp=sharing`

Assessment submission form:

```text
https://forms.gle/HzQH6tB5c4edPjnn8
```

Deadline: **October 15, 2026, 11:59 PM Sri Lanka time**.
