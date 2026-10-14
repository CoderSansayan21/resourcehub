import "dotenv/config";
import crypto from "node:crypto";
import { Pool } from "pg";

const base = process.env.AVAILABILITY_TEST_BASE_URL ?? "http://localhost:3000";
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

function addDaysDate(daysFromNow) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function addDays(dateValue, amount) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function iso(dateValue, time) {
  return `${dateValue}T${time}:00.000Z`;
}

function colomboIso(dateValue, time) {
  return new Date(`${dateValue}T${time}:00+05:30`).toISOString();
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

async function getJson(path, cookieHeader = "") {
  return api(path, {
    headers: { cookie: cookieHeader },
    method: "GET",
  });
}

async function createReservation(memberCookie, body) {
  const response = await postJson("/api/reservations", body, memberCookie);

  if (response.status === 201) {
    createdReservationIds.push(response.data.reservation.id);
  }

  return response;
}

async function createUser(role = "MEMBER") {
  const email = `stage7-availability-${role.toLowerCase()}-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `T3st-${crypto.randomUUID()}!`;
  const signupResponse = await fetch(`${base}/api/auth/sign-up/email`, {
    body: JSON.stringify({
      email,
      name: `Stage Seven ${role}`,
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

async function createResource(adminCookie, name) {
  const response = await postJson(
    "/api/resources",
    {
      capacity: 5,
      description: "Availability smoke test resource",
      location: "Timeline lab",
      name,
      type: "Timeline Room",
    },
    adminCookie,
  );

  assert(response.status === 201, `resource creation failed with status ${response.status}`);
  createdResourceIds.push(response.data.resource.id);
  return response.data.resource;
}

async function insertReservation({
  endTime,
  resourceId,
  startTime,
  status = "CONFIRMED",
  title,
  userId,
}) {
  const id = crypto.randomUUID();

  await pool.query(
    `insert into "Reservation" (
      "id", "userId", "resourceId", "title", "startTime", "endTime",
      "status", "notes", "createdAt", "updatedAt"
    ) values (
      $1, $2, $3, $4, $5::timestamptz, $6::timestamptz,
      $7::"ReservationStatus", $8, now(), now()
    )`,
    [
      id,
      userId,
      resourceId,
      title,
      startTime,
      endTime,
      status,
      `private smoke note ${title}`,
    ],
  );

  createdReservationIds.push(id);
  return id;
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
  const member = await createUser("MEMBER");
  const activeResource = await createResource(
    admin.cookie,
    "Stage 7 Active Timeline Room",
  );
  const colomboResource = await createResource(
    admin.cookie,
    "Stage 7 Colombo Timeline Room",
  );
  const inactiveResource = await createResource(
    admin.cookie,
    "Stage 7 Inactive Timeline Room",
  );

  await patchJson(
    `/api/resources/${inactiveResource.id}/status`,
    { isActive: false },
    admin.cookie,
  );

  const selectedDate = addDaysDate(20);
  const previousDate = addDays(selectedDate, -1);
  const query = `/api/availability?resourceId=${activeResource.id}&date=${selectedDate}&timeZone=UTC`;

  const unauthenticated = await getJson(query);
  assert(unauthenticated.status === 401, "unauthenticated request was not rejected");
  record("Unauthenticated requests are rejected");

  const inactiveMember = await getJson(
    `/api/availability?resourceId=${inactiveResource.id}&date=${selectedDate}&timeZone=UTC`,
    member.cookie,
  );
  assert(inactiveMember.status === 404, "member queried inactive resource");
  record("Member cannot query inactive resources");

  await insertReservation({
    endTime: iso(selectedDate, "01:00"),
    resourceId: activeResource.id,
    startTime: iso(previousDate, "23:00"),
    title: "Private cross-midnight title",
    userId: member.id,
  });
  await insertReservation({
    endTime: iso(selectedDate, "11:00"),
    resourceId: activeResource.id,
    startTime: iso(selectedDate, "10:00"),
    title: "Private first adjacent title",
    userId: member.id,
  });
  await insertReservation({
    endTime: iso(selectedDate, "12:00"),
    resourceId: activeResource.id,
    startTime: iso(selectedDate, "11:00"),
    title: "Private second adjacent title",
    userId: member.id,
  });
  await insertReservation({
    endTime: iso(selectedDate, "14:00"),
    resourceId: activeResource.id,
    startTime: iso(selectedDate, "13:00"),
    status: "CANCELLED",
    title: "Private cancelled title",
    userId: member.id,
  });
  const availabilityResponse = await getJson(query, member.cookie);
  assert(availabilityResponse.status === 200, "availability lookup failed");
  const availability = availabilityResponse.data.availability;

  assert(
    availability.occupied.length === 3,
    `expected 3 occupied intervals, got ${availability.occupied.length}`,
  );
  record("Confirmed bookings are returned for the requested day");

  assert(
    availability.occupied.length === 3,
    "cancelled reservation blocked availability",
  );
  record("Cancelled bookings are excluded");

  const colomboCrossOut = await createReservation(member.cookie, {
    endTime: colomboIso(addDays(selectedDate, 1), "00:30"),
    resourceId: colomboResource.id,
    startTime: colomboIso(selectedDate, "23:30"),
    title: "Colombo cross-midnight title",
  });
  assert(colomboCrossOut.status === 201, "Colombo cross-midnight booking failed");

  const colomboCrossIn = await createReservation(member.cookie, {
    endTime: colomboIso(selectedDate, "00:30"),
    resourceId: colomboResource.id,
    startTime: colomboIso(addDays(selectedDate, -1), "23:30"),
    title: "Colombo prior-night title",
  });
  assert(colomboCrossIn.status === 201, "Colombo prior-night booking failed");

  const colomboReservation = await createReservation(member.cookie, {
    endTime: colomboIso(selectedDate, "10:15"),
    resourceId: colomboResource.id,
    startTime: colomboIso(selectedDate, "09:15"),
    title: "Colombo reference reservation",
  });
  assert(
    colomboReservation.status === 201,
    `Colombo reservation creation failed: ${JSON.stringify(colomboReservation)}`,
  );

  const reservationsResponse = await getJson("/api/reservations", member.cookie);
  assert(reservationsResponse.status === 200, "reservation list lookup failed");
  const listedReservation = reservationsResponse.data.reservations.find(
    (reservation) => reservation.id === colomboReservation.data.reservation.id,
  );
  assert(listedReservation, "created Colombo reservation was missing from Reservations");

  const colomboAvailabilityResponse = await getJson(
    `/api/availability?resourceId=${colomboResource.id}&date=${selectedDate}&timeZone=Asia%2FColombo`,
    member.cookie,
  );
  assert(colomboAvailabilityResponse.status === 200, "Colombo availability lookup failed");
  const colomboAvailability = colomboAvailabilityResponse.data.availability;

  assert(
    listedReservation.startTime === colomboIso(selectedDate, "09:15") &&
      listedReservation.endTime === colomboIso(selectedDate, "10:15"),
    `Reservations returned unexpected Colombo timestamps: ${JSON.stringify(
      listedReservation,
    )}`,
  );
  assert(
    colomboAvailability.occupied.some(
      (interval) =>
        interval.startTime === listedReservation.startTime &&
        interval.endTime === listedReservation.endTime,
    ),
    `Availability did not show the same interval as Reservations: ${JSON.stringify(
      colomboAvailability.occupied,
    )}`,
  );
  record("Reservations and Availability show the same Colombo booking interval");

  assert(
    colomboAvailability.dayStart === colomboIso(selectedDate, "00:00") &&
      colomboAvailability.dayEnd === colomboIso(addDays(selectedDate, 1), "00:00"),
    `Asia/Colombo day bounds were wrong: ${JSON.stringify({
      dayEnd: colomboAvailability.dayEnd,
      dayStart: colomboAvailability.dayStart,
    })}`,
  );
  record("Asia/Colombo timezone conversion is consistent");

  assert(
    colomboAvailability.occupied.some(
      (interval) =>
        interval.startTime === colomboIso(selectedDate, "23:30") &&
        interval.endTime === colomboIso(addDays(selectedDate, 1), "00:00"),
    ),
    `Colombo cross-midnight booking was not clipped at day end: ${JSON.stringify(
      colomboAvailability.occupied,
    )}`,
  );

  const nextDayAvailabilityResponse = await getJson(
    `/api/availability?resourceId=${colomboResource.id}&date=${addDays(
      selectedDate,
      1,
    )}&timeZone=Asia%2FColombo`,
    member.cookie,
  );
  assert(nextDayAvailabilityResponse.status === 200, "next-day Colombo availability failed");
  assert(
    nextDayAvailabilityResponse.data.availability.occupied.some(
      (interval) =>
        interval.startTime === colomboIso(addDays(selectedDate, 1), "00:00") &&
        interval.endTime === colomboIso(addDays(selectedDate, 1), "00:30"),
    ),
    "Colombo cross-midnight booking was not clipped at next day start",
  );
  record("Bookings crossing midnight are split across Colombo calendar days");

  assert(
    colomboAvailability.occupied.some(
      (interval) => interval.startTime === colomboIso(selectedDate, "00:00"),
    ) &&
      colomboAvailability.occupied.some(
        (interval) => interval.endTime === colomboIso(addDays(selectedDate, 1), "00:00"),
      ),
    "partial overlaps at Colombo day boundaries were not marked unavailable",
  );
  record("Partially overlapping intervals are unavailable");

  assert(
    colomboAvailability.free.some(
      (interval) =>
        interval.endTime === listedReservation.startTime &&
        new Date(interval.startTime) < new Date(listedReservation.startTime),
    ) &&
      colomboAvailability.free.some(
        (interval) =>
          interval.startTime === listedReservation.endTime &&
          new Date(interval.endTime) > new Date(listedReservation.endTime),
      ),
    `free intervals before and after the Colombo booking were wrong: ${JSON.stringify(
      colomboAvailability.free,
    )}`,
  );
  record("Available intervals before and after a booking are preserved");

  assert(
    JSON.stringify(availability).includes("Private") === false &&
      JSON.stringify(availability).includes("private smoke note") === false &&
      JSON.stringify(availability).includes(member.id) === false,
    "private reservation data leaked",
  );
  record("No private reservation fields are returned");

  const utcBounds = await getJson(
    `/api/availability?resourceId=${activeResource.id}&date=2026-11-01&timeZone=UTC`,
    member.cookie,
  );
  const newYorkBounds = await getJson(
    `/api/availability?resourceId=${activeResource.id}&date=2026-11-01&timeZone=America%2FNew_York`,
    member.cookie,
  );
  assert(utcBounds.status === 200, "UTC timezone lookup failed");
  assert(newYorkBounds.status === 200, "New York timezone lookup failed");

  const utcDuration =
    new Date(utcBounds.data.availability.dayEnd).getTime() -
    new Date(utcBounds.data.availability.dayStart).getTime();
  const newYorkDuration =
    new Date(newYorkBounds.data.availability.dayEnd).getTime() -
    new Date(newYorkBounds.data.availability.dayStart).getTime();

  assert(utcDuration === 24 * 60 * 60 * 1000, "UTC day was not 24 hours");
  assert(
    newYorkDuration === 25 * 60 * 60 * 1000,
    "DST New York day was not 25 hours",
  );
  record("Different timezones produce correct day boundaries");

  const invalidUuid = await getJson(
    `/api/availability?resourceId=not-a-uuid&date=${selectedDate}&timeZone=UTC`,
    member.cookie,
  );
  const invalidDate = await getJson(
    `/api/availability?resourceId=${activeResource.id}&date=2026-02-30&timeZone=UTC`,
    member.cookie,
  );
  const invalidTimeZone = await getJson(
    `/api/availability?resourceId=${activeResource.id}&date=${selectedDate}&timeZone=Nope%2FNowhere`,
    member.cookie,
  );

  assert(
    invalidUuid.status === 400 &&
      invalidDate.status === 400 &&
      invalidTimeZone.status === 400,
    "invalid inputs were not rejected safely",
  );
  record("Invalid inputs are rejected safely");

  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await cleanup();
  await pool.end();
}
