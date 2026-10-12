import "dotenv/config";
import crypto from "node:crypto";
import { Pool } from "pg";

const base = process.env.RESERVATION_TEST_BASE_URL ?? "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const createdUserIds = [];
const createdResourceIds = [];
const createdReservationIds = [];
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

function futureIso(daysFromNow, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");

  return `${year}-${month}-${day}T${hh}:${mm}:00+05:30`;
}

async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      ...(options.headers ?? {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

  return {
    data,
    ok: response.ok,
    status: response.status,
  };
}

async function postJson(path, body, cookieHeader = "") {
  return api(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
      origin: base,
    },
    method: "POST",
  });
}

async function patchJson(path, body, cookieHeader = "") {
  return api(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
      origin: base,
    },
    method: "PATCH",
  });
}

async function patchEmpty(path, cookieHeader = "") {
  return api(path, {
    headers: {
      cookie: cookieHeader,
      origin: base,
    },
    method: "PATCH",
  });
}

async function createUser(role = "MEMBER") {
  const email = `stage6-concurrency-${role.toLowerCase()}-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `T3st-${crypto.randomUUID()}!`;
  const signupResponse = await fetch(`${base}/api/auth/sign-up/email`, {
    body: JSON.stringify({
      email,
      name: `Stage Six Concurrency ${role}`,
      password,
    }),
    headers: {
      "content-type": "application/json",
      origin: base,
    },
    method: "POST",
    redirect: "manual",
  });

  assert(signupResponse.ok, `${role} signup failed with status ${signupResponse.status}`);

  const cookieHeader = cookie(signupResponse.headers);
  const userResult = await pool.query(
    'select id::text from "User" where email=$1',
    [email],
  );
  const user = userResult.rows[0];

  assert(user, `${role} test user was not found in the database`);
  createdUserIds.push(user.id);

  if (role === "ADMIN") {
    await pool.query('update "User" set role=$1 where id=$2', ["ADMIN", user.id]);
  }

  return {
    cookie: cookieHeader,
    id: user.id,
  };
}

async function createResource(adminCookie) {
  const response = await postJson(
    "/api/resources",
    {
      capacity: 8,
      description: "Concurrency smoke test resource",
      location: "Constraint lab",
      name: `Stage 6 Constraint Room ${crypto.randomUUID()}`,
      type: "Constraint Room",
    },
    adminCookie,
  );

  assert(response.status === 201, `resource creation failed with status ${response.status}`);
  createdResourceIds.push(response.data.resource.id);
  return response.data.resource;
}

async function createReservation(memberCookie, resourceId, startTime, endTime, title) {
  const response = await postJson(
    "/api/reservations",
    {
      endTime,
      resourceId,
      startTime,
      title,
    },
    memberCookie,
  );

  if (response.status === 201) {
    createdReservationIds.push(response.data.reservation.id);
  }

  return response;
}

async function confirmedCountForResource(resourceId) {
  const result = await pool.query(
    `select count(*)::int as count
       from "Reservation"
      where "resourceId"=$1
        and "status"='CONFIRMED'`,
    [resourceId],
  );

  return result.rows[0].count;
}

async function confirmedOverlapCountForReservation(reservationId) {
  const result = await pool.query(
    `select count(*)::int as count
       from "Reservation" target
       join "Reservation" other
         on other."resourceId" = target."resourceId"
        and other."status" = 'CONFIRMED'
        and other."startTime" < target."endTime"
        and other."endTime" > target."startTime"
      where target."id"=$1
        and target."status"='CONFIRMED'`,
    [reservationId],
  );

  return result.rows[0].count;
}

async function reservationWindow(reservationId) {
  const result = await pool.query(
    `select "startTime"::text as "startTime", "endTime"::text as "endTime"
       from "Reservation"
      where "id"=$1`,
    [reservationId],
  );

  return result.rows[0];
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
  const admin = await createUser("ADMIN");
  const memberA = await createUser("MEMBER");
  const memberB = await createUser("MEMBER");
  const memberC = await createUser("MEMBER");
  const resource = await createResource(admin.cookie);

  const concurrentStart = futureIso(9, 10);
  const concurrentEnd = futureIso(9, 11);
  const concurrentResponses = await Promise.all(
    [memberA, memberB, memberC, memberA, memberB].map((member, index) =>
      createReservation(
        member.cookie,
        resource.id,
        concurrentStart,
        concurrentEnd,
        `Concurrent request ${index + 1}`,
      ),
    ),
  );

  const successes = concurrentResponses.filter((response) => response.status === 201);
  const conflicts = concurrentResponses.filter((response) => response.status === 409);
  const concurrentWinner = successes[0]?.data.reservation;

  assert(successes.length === 1, `expected exactly one success, got ${successes.length}`);
  assert(conflicts.length === 4, `expected four conflicts, got ${conflicts.length}`);
  const concurrentConfirmedCount = await confirmedCountForResource(resource.id);
  assert(
    concurrentConfirmedCount === 1,
    `database contained ${concurrentConfirmedCount} confirmed concurrent reservations`,
  );
  record("Concurrent identical bookings produce one success and conflicts");

  const backToBack = await createReservation(
    memberA.cookie,
    resource.id,
    concurrentEnd,
    futureIso(9, 12),
    "Back-to-back after concurrent winner",
  );
  assert(backToBack.status === 201, "back-to-back reservation failed");
  record("Back-to-back bookings still succeed");

  const winnerId = concurrentWinner.id;
  const cancel = await patchEmpty(
    `/api/reservations/${winnerId}/cancel`,
    concurrentWinner.userId === memberA.id
      ? memberA.cookie
      : concurrentWinner.userId === memberB.id
        ? memberB.cookie
        : memberC.cookie,
  );
  assert(cancel.status === 200, "canceling concurrent winner failed");

  const replacement = await createReservation(
    memberC.cookie,
    resource.id,
    concurrentStart,
    concurrentEnd,
    "Replacement after cancellation",
  );
  assert(replacement.status === 201, "cancellation did not free slot");
  record("Cancellation frees the constrained slot");

  const rescheduleA = await createReservation(
    memberA.cookie,
    resource.id,
    futureIso(10, 8),
    futureIso(10, 9),
    "Reschedule source A",
  );
  const rescheduleB = await createReservation(
    memberB.cookie,
    resource.id,
    futureIso(10, 9),
    futureIso(10, 10),
    "Reschedule source B",
  );
  assert(rescheduleA.status === 201, "reschedule source A creation failed");
  assert(rescheduleB.status === 201, "reschedule source B creation failed");

  const targetStart = futureIso(10, 14);
  const targetEnd = futureIso(10, 15);
  const rescheduleResponses = await Promise.all([
    patchJson(
      `/api/reservations/${rescheduleA.data.reservation.id}`,
      { endTime: targetEnd, startTime: targetStart },
      memberA.cookie,
    ),
    patchJson(
      `/api/reservations/${rescheduleB.data.reservation.id}`,
      { endTime: targetEnd, startTime: targetStart },
      memberB.cookie,
    ),
  ]);
  assert(
    rescheduleResponses.filter((response) => response.status === 200).length === 1,
    "concurrent rescheduling did not produce exactly one success",
  );
  assert(
    rescheduleResponses.filter((response) => response.status === 409).length === 1,
    "concurrent rescheduling did not produce exactly one conflict",
  );
  const successfulReschedule = rescheduleResponses.find(
    (response) => response.status === 200,
  )?.data.reservation;
  const rescheduledConfirmedCount = await confirmedOverlapCountForReservation(
    successfulReschedule.id,
  );
  assert(
    rescheduledConfirmedCount === 1,
    `database contained ${rescheduledConfirmedCount} confirmed reservations overlapping the rescheduled slot`,
  );
  record("Concurrent rescheduling cannot create overlapping confirmed bookings");

  const directConflictId = crypto.randomUUID();
  const directConflictWindow = await reservationWindow(successfulReschedule.id);
  try {
    await pool.query(
      `insert into "Reservation" (
        "id", "userId", "resourceId", "title", "startTime", "endTime",
        "status", "createdAt", "updatedAt"
      ) values (
        $1, $2, $3, $4, $5::timestamptz, $6::timestamptz,
        'CONFIRMED', now(), now()
      )`,
      [
        directConflictId,
        memberA.id,
        resource.id,
        "Direct conflicting insert",
        directConflictWindow.startTime,
        directConflictWindow.endTime,
      ],
    );
    createdReservationIds.push(directConflictId);
    throw new Error("direct conflicting insert unexpectedly succeeded");
  } catch (error) {
    assert(error?.code === "23P01", `expected SQLSTATE 23P01, got ${error?.code}`);
  }
  record("Database constraint rejects direct conflicting insert");

  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await cleanup();
  await pool.end();
}
