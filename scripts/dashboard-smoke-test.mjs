import "dotenv/config";
import crypto from "node:crypto";
import { Pool } from "pg";

const base = process.env.DASHBOARD_TEST_BASE_URL ?? "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const createdReservationIds = [];
const createdResourceIds = [];
const createdUserIds = [];
const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function record(name) {
  results.push(name);
}

function cookie(headers) {
  const raw = headers.get("set-cookie") || "";

  return raw
    .split(/,(?=[^;]+?=)/)
    .map((value) => value.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function request(path, options = {}) {
  return fetch(`${base}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      ...(options.headers ?? {}),
    },
  });
}

async function postJson(path, body, cookieHeader = "") {
  const response = await request(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
      origin: base,
    },
    method: "POST",
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

  return {
    cookie: cookie(response.headers),
    data,
    ok: response.ok,
    status: response.status,
  };
}

async function createUser(role, name) {
  const email = `stage8-dashboard-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `T3st-${crypto.randomUUID()}!`;
  const signup = await postJson("/api/auth/sign-up/email", {
    email,
    name,
    password,
  });

  assert(signup.ok, `${role} signup failed with status ${signup.status}`);

  const userResult = await pool.query(
    'select id::text, role from "User" where email=$1',
    [email],
  );
  const user = userResult.rows[0];

  assert(user, `${role} user was not found in the database`);
  createdUserIds.push(user.id);

  if (role === "ADMIN") {
    await pool.query('update "User" set role=$1 where id=$2', ["ADMIN", user.id]);
  }

  return {
    cookie: signup.cookie,
    email,
    id: user.id,
    name,
  };
}

async function createResource({ isActive, name }) {
  const id = crypto.randomUUID();

  await pool.query(
    `insert into "Resource" (
      id, name, type, description, location, capacity, "isActive", "createdAt", "updatedAt"
    ) values ($1::uuid, $2, $3, $4, $5, $6, $7, now(), now())`,
    [
      id,
      name,
      "Dashboard Smoke Room",
      "Disposable dashboard smoke resource",
      `${name} Location`,
      6,
      isActive,
    ],
  );

  createdResourceIds.push(id);
  return id;
}

async function createReservation({
  endMinutesFromNow,
  resourceId,
  startMinutesFromNow,
  status = "CONFIRMED",
  title,
  userId,
}) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const start = new Date(now + startMinutesFromNow * 60 * 1000).toISOString();
  const end = new Date(now + endMinutesFromNow * 60 * 1000).toISOString();

  await pool.query(
    `insert into "Reservation" (
      id, "userId", "resourceId", title, "startTime", "endTime", status, notes, "createdAt", "updatedAt"
    ) values (
      $1::uuid, $2::uuid, $3::uuid, $4, $5::timestamptz, $6::timestamptz,
      $7::"ReservationStatus", $8, now(), now()
    )`,
    [
      id,
      userId,
      resourceId,
      title,
      start,
      end,
      status,
      `Private note for ${title}`,
    ],
  );

  createdReservationIds.push(id);
  return id;
}

async function dashboardHtml(cookieHeader = "") {
  const response = await request("/dashboard", {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  const html = await response.text();

  return { html, response };
}

function plainText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

async function cleanup() {
  for (const reservationId of createdReservationIds.reverse()) {
    await pool.query('delete from "Reservation" where id=$1', [reservationId]);
  }

  for (const resourceId of createdResourceIds.reverse()) {
    await pool.query('delete from "Resource" where id=$1', [resourceId]);
  }

  for (const userId of createdUserIds.reverse()) {
    await pool.query('update "User" set role=$1 where id=$2', ["MEMBER", userId]);
    await pool.query('delete from "User" where id=$1', [userId]);
  }
}

try {
  const unauth = await request("/dashboard");
  assert(
    [303, 307, 308].includes(unauth.status) &&
      (unauth.headers.get("location") ?? "").includes("/login"),
    "unauthenticated /dashboard did not redirect to /login",
  );
  record("Unauthenticated access redirects to login");

  const memberA = await createUser("MEMBER", "Stage 8 Member A");
  const memberB = await createUser("MEMBER", "Stage 8 Member B");
  const admin = await createUser("ADMIN", "Stage 8 Admin");

  const activeA = await createResource({ isActive: true, name: "Stage 8 Active Alpha" });
  const activeB = await createResource({ isActive: true, name: "Stage 8 Active Beta" });
  await createResource({ isActive: false, name: "Stage 8 Inactive Hidden" });

  await createReservation({
    endMinutesFromNow: 80,
    resourceId: activeA,
    startMinutesFromNow: 20,
    title: "Stage 8 Next Own Booking",
    userId: memberA.id,
  });
  await createReservation({
    endMinutesFromNow: 170,
    resourceId: activeB,
    startMinutesFromNow: 120,
    title: "Stage 8 Later Own Booking",
    userId: memberA.id,
  });
  await createReservation({
    endMinutesFromNow: 260,
    resourceId: activeB,
    startMinutesFromNow: 220,
    title: "Stage 8 Other Member Booking",
    userId: memberB.id,
  });
  await createReservation({
    endMinutesFromNow: 360,
    resourceId: activeA,
    startMinutesFromNow: 320,
    status: "CANCELLED",
    title: "Stage 8 Cancelled Booking",
    userId: memberA.id,
  });
  await createReservation({
    endMinutesFromNow: -100000,
    resourceId: activeA,
    startMinutesFromNow: -100060,
    title: "Stage 8 Past Booking",
    userId: memberA.id,
  });

  const activeResourceCount = Number(
    (await pool.query('select count(*)::int as count from "Resource" where "isActive"=true')).rows[0].count,
  );
  const totalResourceCount = Number(
    (await pool.query('select count(*)::int as count from "Resource"')).rows[0].count,
  );

  const memberDashboard = await dashboardHtml(memberA.cookie);
  assert(memberDashboard.response.status === 200, "member dashboard did not load");
  const memberText = plainText(memberDashboard.html);

  assert(memberText.includes("Stage 8 Member A"), "member name was not shown");
  assert(memberText.includes("Stage 8 Next Own Booking"), "next own booking missing");
  assert(memberText.includes("Stage 8 Later Own Booking"), "later own booking missing");
  assert(
    !memberText.includes("Stage 8 Other Member Booking"),
    "member dashboard exposed another member reservation",
  );
  assert(
    !memberText.includes("Stage 8 Cancelled Booking") &&
      !memberText.includes("Stage 8 Past Booking"),
    "member dashboard included cancelled or past reservations",
  );
  assert(
    memberText.indexOf("Stage 8 Next Own Booking") <
      memberText.indexOf("Stage 8 Later Own Booking"),
    "member upcoming reservations were not ordered by next start time",
  );
  assert(
    memberText.includes(activeResourceCount.toLocaleString("en")),
    "active resource count was not rendered for member",
  );
  assert(
    !memberText.includes("Private note for Stage 8 Next Own Booking"),
    "dashboard exposed reservation notes",
  );
  record("Member sees only own upcoming confirmed reservations and real active count");

  const adminDashboard = await dashboardHtml(admin.cookie);
  assert(adminDashboard.response.status === 200, "admin dashboard did not load");
  const adminText = plainText(adminDashboard.html);

  assert(adminText.includes("Administrator dashboard"), "admin dashboard label missing");
  assert(adminText.includes(totalResourceCount.toLocaleString("en")), "total resource count missing");
  assert(adminText.includes(activeResourceCount.toLocaleString("en")), "active resource count missing for admin");
  assert(
    adminText.includes("Stage 8 Next Own Booking") &&
      adminText.includes("Stage 8 Other Member Booking"),
    "admin dashboard did not show authorized system-wide upcoming activity",
  );
  assert(
    !adminText.includes("Stage 8 Cancelled Booking") &&
      !adminText.includes("Stage 8 Past Booking"),
    "admin dashboard included cancelled or past reservations",
  );
  assert(
    !adminText.includes("Private note for Stage 8 Other Member Booking"),
    "admin dashboard exposed reservation notes",
  );
  record("Admin sees authorized system-wide metrics and upcoming activity");

  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await cleanup();
  await pool.end();
}