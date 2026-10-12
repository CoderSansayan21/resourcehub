import "dotenv/config";
import crypto from "node:crypto";
import { Pool } from "pg";

const base = process.env.RESOURCE_TEST_BASE_URL ?? "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const createdUserIds = [];
const createdResourceIds = [];
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

async function createUser(role = "MEMBER") {
  const email = `stage5-resource-${role.toLowerCase()}-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `T3st-${crypto.randomUUID()}!`;
  const signupResponse = await fetch(`${base}/api/auth/sign-up/email`, {
    body: JSON.stringify({
      email,
      name: `Stage Five ${role}`,
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

async function cleanup() {
  for (const resourceId of createdResourceIds.reverse()) {
    await pool.query('delete from "Resource" where id=$1', [resourceId]);
  }

  for (const userId of createdUserIds.reverse()) {
    await pool.query('update "User" set role=$1 where id=$2', ["MEMBER", userId]);
    await pool.query('delete from "User" where id=$1', [userId]);
  }
}

try {
  const existingResources = await pool.query('select id::text from "Resource"');
  const existingResourceIds = existingResources.rows.map((row) => row.id);

  const member = await createUser("MEMBER");
  const admin = await createUser("ADMIN");

  const memberCreate = await postJson(
    "/api/resources",
    { name: "Member Attempt", type: "Room" },
    member.cookie,
  );
  assert(memberCreate.status === 403, "MEMBER was able to create a resource");

  const invalidCreate = await postJson(
    "/api/resources",
    { capacity: -1, name: "Bad", type: "Room", unexpected: true },
    admin.cookie,
  );
  assert(invalidCreate.status === 400, "invalid resource input was not rejected");
  record("Invalid input is rejected");

  const create = await postJson(
    "/api/resources",
    {
      capacity: 12,
      description: "  Smoke test resource  ",
      location: "  Test wing  ",
      name: "  Stage 5 Resource  ",
      type: "  Meeting Room  ",
    },
    admin.cookie,
  );
  assert(create.status === 201, `ADMIN create failed with status ${create.status}`);
  const resource = create.data.resource;
  createdResourceIds.push(resource.id);
  assert(resource.name === "Stage 5 Resource", "resource name was not trimmed");
  assert(resource.type === "Meeting Room", "resource type was not trimmed");
  record("ADMIN can create resources");

  const memberUpdate = await patchJson(
    `/api/resources/${resource.id}`,
    { name: "Member Update" },
    member.cookie,
  );
  assert(memberUpdate.status === 403, "MEMBER was able to update a resource");

  const update = await patchJson(
    `/api/resources/${resource.id}`,
    { capacity: 16, location: "Updated wing", name: "Updated Stage 5 Resource" },
    admin.cookie,
  );
  assert(update.status === 200, `ADMIN update failed with status ${update.status}`);
  assert(update.data.resource.capacity === 16, "resource capacity was not updated");
  record("ADMIN can update resources");

  const badUuid = await getJson("/api/resources/not-a-uuid", admin.cookie);
  assert(badUuid.status === 400, "malformed UUID was not rejected");

  const memberDeactivate = await patchJson(
    `/api/resources/${resource.id}/status`,
    { isActive: false },
    member.cookie,
  );
  assert(memberDeactivate.status === 403, "MEMBER was able to deactivate a resource");
  record("MEMBER cannot create, update, or deactivate resources");

  const deactivate = await patchJson(
    `/api/resources/${resource.id}/status`,
    { isActive: false },
    admin.cookie,
  );
  assert(deactivate.status === 200, "ADMIN could not deactivate resource");
  assert(deactivate.data.resource.isActive === false, "resource was not deactivated");

  const memberList = await getJson("/api/resources", member.cookie);
  assert(memberList.status === 200, "MEMBER resource list failed");
  assert(
    !memberList.data.resources.some((item) => item.id === resource.id),
    "inactive resource appeared in MEMBER listing",
  );
  record("Inactive resources are hidden from member listings");

  const adminList = await getJson("/api/resources", admin.cookie);
  assert(adminList.status === 200, "ADMIN resource list failed");
  assert(
    adminList.data.resources.some((item) => item.id === resource.id && item.isActive === false),
    "inactive resource did not appear in ADMIN listing",
  );
  record("Admin listings include inactive resources");

  const reactivate = await patchJson(
    `/api/resources/${resource.id}/status`,
    { isActive: true },
    admin.cookie,
  );
  assert(reactivate.status === 200, "ADMIN could not reactivate resource");
  assert(reactivate.data.resource.isActive === true, "resource was not reactivated");

  const detail = await getJson(`/api/resources/${resource.id}`, member.cookie);
  assert(detail.status === 200, "MEMBER could not view active resource details");

  await cleanup();

  const preserved = await pool.query(
    'select count(*)::int as count from "Resource" where id = any($1::uuid[])',
    [existingResourceIds],
  );
  assert(
    preserved.rows[0].count === existingResourceIds.length,
    "existing resource records were not preserved",
  );
  record("Existing resource records are preserved");

  console.log(JSON.stringify({ passed: results }, null, 2));
} finally {
  await cleanup();
  await pool.end();
}
