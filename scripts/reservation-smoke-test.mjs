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
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function pastIso() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString();
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

async function getJson(path, cookieHeader = "") {
  return api(path, {
    headers: { cookie: cookieHeader },
    method: "GET",
  });
}

async function createUser(role = "MEMBER") {
  const email = `stage6-reservation-${role.toLowerCase()}-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `T3st-${crypto.randomUUID()}!`;
  const signupResponse = await fetch(`${base}/api/auth/sign-up/email`, {
    body: JSON.stringify({
      email,
      name: `Stage Six ${role}`,
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
    'select id::text, role from "User" where email=$1',
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
    email,
    id: user.id,
  };
}

async function createResource(adminCookie, name) {
  const response = await postJson(
    "/api/resources",
    {
      capacity: 6,
      description: "Reservation smoke test resource",
      location: "Test wing",
      name,
      type: "Smoke Room",
    },
    adminCookie,
  );

  assert(response.status === 201, `resource creation failed with status ${response.status}`);
  createdResourceIds.push(response.data.resource.id);
  return response.data.resource;
}

async function createReservation(memberCookie, body) {
  const response = await postJson("/api/reservations", body, memberCookie);

  if (response.status === 201) {
    createdReservationIds.push(response.data.reservation.id);
  }

  return response;
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
  const activeResource = await createResource(
    admin.cookie,
    "Stage 6 Active Reservation Room",
  );
  const inactiveResource = await createResource(
    admin.cookie,
    "Stage 6 Inactive Reservation Room",
  );
  await patchJson(
    `/api/resources/${inactiveResource.id}/status`,
    { isActive: false },
    admin.cookie,
  );

  const baseReservation = await createReservation(memberA.cookie, {
    endTime: futureIso(7, 11),
    notes: "Smoke test notes",
    resourceId: activeResource.id,
    startTime: futureIso(7, 10),
    title: "Stage 6 base reservation",
  });
  assert(baseReservation.status === 201, "MEMBER could not create a reservation");
  const baseReservationId = baseReservation.data.reservation.id;
  record("Member creates a reservation");

  const memberAList = await getJson("/api/reservations", memberA.cookie);
  assert(
    memberAList.status === 200 &&
      memberAList.data.reservations.some((item) => item.id === baseReservationId),
    "owner did not see their reservation",
  );

  const memberBList = await getJson("/api/reservations", memberB.cookie);
  assert(
    memberBList.status === 200 &&
      !memberBList.data.reservations.some((item) => item.id === baseReservationId),
    "member saw another user's reservation",
  );
  record("Member sees only their own reservations");

  const memberBInspect = await getJson(
    `/api/reservations/${baseReservationId}`,
    memberB.cookie,
  );
  assert(memberBInspect.status === 404, "member inspected another user's reservation");

  const memberBModify = await patchJson(
    `/api/reservations/${baseReservationId}`,
    { title: "Cross-user edit" },
    memberB.cookie,
  );
  assert(memberBModify.status === 403, "member modified another user's reservation");
  record("Member cannot access or modify another user's reservation");

  const adminList = await getJson("/api/reservations", admin.cookie);
  assert(
    adminList.status === 200 &&
      adminList.data.reservations.some((item) => item.id === baseReservationId),
    "admin did not see all reservations",
  );

  const adminInspect = await getJson(
    `/api/reservations/${baseReservationId}`,
    admin.cookie,
  );
  assert(adminInspect.status === 200, "admin could not inspect reservation");
  record("Admin can list and inspect all reservations");

  const adminCancelTarget = await createReservation(memberA.cookie, {
    endTime: futureIso(9, 11),
    resourceId: activeResource.id,
    startTime: futureIso(9, 10),
    title: "Admin cancellation target",
  });
  assert(adminCancelTarget.status === 201, "admin cancellation target was not created");
  const adminCancelTargetId = adminCancelTarget.data.reservation.id;

  const memberBCancelOther = await patchEmpty(
    `/api/reservations/${adminCancelTargetId}/cancel`,
    memberB.cookie,
  );
  assert(
    memberBCancelOther.status === 403,
    "member cancelled another member's reservation",
  );

  const adminCancel = await patchEmpty(
    `/api/reservations/${adminCancelTargetId}/cancel`,
    admin.cookie,
  );
  assert(
    adminCancel.status === 200 &&
      adminCancel.data.reservation.status === "CANCELLED" &&
      adminCancel.data.reservation.user.email === memberA.email,
    "admin could not cancel a member reservation",
  );

  const repeatedAdminCancel = await patchEmpty(
    `/api/reservations/${adminCancelTargetId}/cancel`,
    admin.cookie,
  );
  assert(repeatedAdminCancel.status === 409, "repeated cancellation was accepted");

  const adminCancelledReplacement = await createReservation(memberB.cookie, {
    endTime: futureIso(9, 10, 45),
    resourceId: activeResource.id,
    startTime: futureIso(9, 10, 15),
    title: "Replacement after admin cancellation",
  });
  assert(
    adminCancelledReplacement.status === 201,
    "admin-cancelled booking still blocked the time slot",
  );
  record("Admin can cancel eligible member reservations safely");

  const overlap = await createReservation(memberB.cookie, {
    endTime: futureIso(7, 10, 45),
    resourceId: activeResource.id,
    startTime: futureIso(7, 10, 15),
    title: "Overlapping reservation",
  });
  assert(overlap.status === 409, "overlapping booking was not rejected");
  record("Overlapping bookings are rejected with 409");

  const backToBack = await createReservation(memberB.cookie, {
    endTime: futureIso(7, 12),
    resourceId: activeResource.id,
    startTime: futureIso(7, 11),
    title: "Back-to-back reservation",
  });
  assert(backToBack.status === 201, "back-to-back booking was not allowed");
  const backToBackId = backToBack.data.reservation.id;
  record("Back-to-back bookings are allowed");

  const cancel = await patchEmpty(
    `/api/reservations/${baseReservationId}/cancel`,
    memberA.cookie,
  );
  assert(
    cancel.status === 200 && cancel.data.reservation.status === "CANCELLED",
    "reservation cancellation failed",
  );

  const replacement = await createReservation(memberB.cookie, {
    endTime: futureIso(7, 10, 45),
    resourceId: activeResource.id,
    startTime: futureIso(7, 10, 15),
    title: "Replacement after cancellation",
  });
  assert(
    replacement.status === 201,
    "cancelled booking still blocked the time slot",
  );
  record("Cancelled bookings no longer block time slots");

  const conflictingReschedule = await patchJson(
    `/api/reservations/${backToBackId}`,
    {
      endTime: futureIso(7, 11, 30),
      startTime: futureIso(7, 10, 30),
    },
    memberB.cookie,
  );
  assert(
    conflictingReschedule.status === 409,
    "conflicting reschedule was not rejected",
  );

  const validReschedule = await patchJson(
    `/api/reservations/${backToBackId}`,
    {
      endTime: futureIso(7, 13),
      startTime: futureIso(7, 12),
    },
    memberB.cookie,
  );
  assert(validReschedule.status === 200, "valid reschedule failed");
  record("Rescheduling validates conflicts");

  const invalidTime = await createReservation(memberA.cookie, {
    endTime: futureIso(8, 10),
    resourceId: activeResource.id,
    startTime: "2030-01-01T09:00:00",
    title: "Invalid time",
  });
  assert(invalidTime.status === 400, "timezone-less time was accepted");

  const pastTime = await createReservation(memberA.cookie, {
    endTime: futureIso(8, 10),
    resourceId: activeResource.id,
    startTime: pastIso(),
    title: "Past time",
  });
  assert(pastTime.status === 400, "past reservation was accepted");
  record("Invalid and past times are rejected");

  const inactiveBooking = await createReservation(memberA.cookie, {
    endTime: futureIso(8, 11),
    resourceId: inactiveResource.id,
    startTime: futureIso(8, 10),
    title: "Inactive resource booking",
  });
  assert(inactiveBooking.status === 404, "inactive resource was bookable");
  record("Inactive resources cannot be booked");

  const preserved = await pool.query(
    'select status from "Reservation" where id=$1',
    [baseReservationId],
  );
  assert(
    preserved.rows[0]?.status === "CANCELLED",
    "cancellation did not preserve the reservation record",
  );
  record("Cancellation preserves the database record");

  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await cleanup();
  await pool.end();
}
