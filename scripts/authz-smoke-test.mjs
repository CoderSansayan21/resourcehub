import "dotenv/config";
import crypto from "node:crypto";
import { Pool } from "pg";

const base = process.env.AUTHZ_TEST_BASE_URL ?? "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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

async function createMember() {
  const email = `stage4-step5-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `T3st-${crypto.randomUUID()}!`;
  const signup = await postJson("/api/auth/sign-up/email", {
    email,
    name: "Stage Five Member",
    password,
  });

  assert(signup.ok, `member signup failed with status ${signup.status}`);

  const userResult = await pool.query(
    'select id::text, role from "User" where email=$1',
    [email],
  );
  const user = userResult.rows[0];

  assert(user, "created member was not found in the database");
  assert(user.role === "MEMBER", "public signup did not create MEMBER role");

  createdUserIds.push(user.id);

  return {
    cookie: signup.cookie,
    email,
    id: user.id,
  };
}

async function countSessions(userId) {
  const result = await pool.query(
    'select count(*)::int as count from "Session" where "userId"=$1',
    [userId],
  );

  return result.rows[0].count;
}

async function cleanup() {
  for (const userId of createdUserIds.reverse()) {
    await pool.query('update "User" set role=$1 where id=$2', ["MEMBER", userId]);
    await pool.query('delete from "User" where id=$1', [userId]);
  }
}

try {
  const dashboardUnauth = await request("/dashboard");
  assert(
    [303, 307, 308].includes(dashboardUnauth.status) &&
      (dashboardUnauth.headers.get("location") ?? "").includes("/login"),
    "unauthenticated /dashboard did not redirect to /login",
  );
  record("Unauthenticated /dashboard redirects to /login");

  const adminUnauth = await request("/admin");
  assert(
    [303, 307, 308].includes(adminUnauth.status) &&
      (adminUnauth.headers.get("location") ?? "").includes("/login"),
    "unauthenticated /admin was not denied via /login redirect",
  );
  record("Unauthenticated /admin is denied");

  const member = await createMember();

  const memberDashboard = await request("/dashboard", {
    headers: { cookie: member.cookie },
  });
  assert(memberDashboard.status === 200, "MEMBER could not access /dashboard");
  record("MEMBER can access /dashboard");

  const memberAdmin = await request("/admin", {
    headers: { cookie: member.cookie },
  });
  assert(memberAdmin.status === 403, "MEMBER could access /admin");
  record("MEMBER cannot access /admin");

  const forgedAdmin = await request("/admin", {
    headers: {
      cookie: member.cookie,
      "x-resourcehub-role": "ADMIN",
      "x-user-role": "ADMIN",
    },
  });
  assert(
    forgedAdmin.status === 403,
    "forged client-side role header granted ADMIN access",
  );
  record("Forged client-side role does not grant ADMIN permissions");

  await pool.query('update "User" set role=$1 where id=$2', ["ADMIN", member.id]);
  const adminAccess = await request("/admin", {
    headers: { cookie: member.cookie },
  });
  assert(adminAccess.status === 200, "controlled local ADMIN could not access /admin");
  record("Controlled local ADMIN can access /admin");
  await pool.query('update "User" set role=$1 where id=$2', ["MEMBER", member.id]);

  const beforeLogoutSessions = await countSessions(member.id);
  assert(beforeLogoutSessions > 0, "test user had no database session before logout");

  const signout = await postJson("/api/auth/sign-out", {}, member.cookie);
  assert(signout.ok, `logout failed with status ${signout.status}`);

  const afterLogoutSessions = await countSessions(member.id);
  assert(
    afterLogoutSessions < beforeLogoutSessions,
    "logout did not invalidate the database session",
  );

  const dashboardAfterLogout = await request("/dashboard", {
    headers: { cookie: member.cookie },
  });
  assert(
    [303, 307, 308].includes(dashboardAfterLogout.status) &&
      (dashboardAfterLogout.headers.get("location") ?? "").includes("/login"),
    "logged-out session still accessed /dashboard",
  );
  record("Logout invalidates the session");

  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await cleanup();
  await pool.end();
}
