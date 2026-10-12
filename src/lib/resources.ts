import "server-only";

import type { Resource } from "@/generated/prisma/client";
import type { CurrentUser } from "@/lib/authorization";
import { getCurrentUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESOURCE_INPUT_FIELDS = [
  "capacity",
  "description",
  "location",
  "name",
  "type",
] as const;

const STATUS_INPUT_FIELDS = ["isActive"] as const;

const LIMITS = {
  description: 500,
  location: 160,
  name: 120,
  type: 80,
} as const;


type ResourceWriteData = {
  capacity?: number | null;
  description?: string | null;
  location?: string | null;
  name?: string;
  type?: string;
};

export type ResourceDto = {
  capacity: number | null;
  createdAt: string;
  description: string | null;
  id: string;
  isActive: boolean;
  location: string | null;
  name: string;
  type: string;
  updatedAt: string;
};

export class ResourceOperationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ResourceOperationError";
    this.status = status;
  }
}

function toResourceDto(resource: Resource): ResourceDto {
  return {
    capacity: resource.capacity,
    createdAt: resource.createdAt.toISOString(),
    description: resource.description,
    id: resource.id,
    isActive: resource.isActive,
    location: resource.location,
    name: resource.name,
    type: resource.type,
    updatedAt: resource.updatedAt.toISOString(),
  };
}

function assertPlainObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ResourceOperationError(400, "Request body must be an object.");
  }

  return input as Record<string, unknown>;
}

function rejectUnknownFields(
  input: Record<string, unknown>,
  allowedFields: readonly string[],
) {
  const unknownFields = Object.keys(input).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unknownFields.length > 0) {
    throw new ResourceOperationError(400, "Request body contains unknown fields.");
  }
}

function optionalTrimmedString(
  input: Record<string, unknown>,
  field: "description" | "location",
): string | null | undefined {
  if (!(field in input)) {
    return undefined;
  }

  const value = input[field];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ResourceOperationError(400, `${field} must be text when supplied.`);
  }

  const trimmed = value.trim();

  if (trimmed.length > LIMITS[field]) {
    throw new ResourceOperationError(
      400,
      `${field} must be ${LIMITS[field]} characters or fewer.`,
    );
  }

  return trimmed.length > 0 ? trimmed : null;
}

function requiredTrimmedString(
  input: Record<string, unknown>,
  field: "name" | "type",
  mode: "create" | "update",
): string | undefined {
  if (!(field in input)) {
    if (mode === "create") {
      throw new ResourceOperationError(400, `${field} is required.`);
    }

    return undefined;
  }

  const value = input[field];

  if (typeof value !== "string") {
    throw new ResourceOperationError(400, `${field} must be text.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ResourceOperationError(400, `${field} is required.`);
  }

  if (trimmed.length > LIMITS[field]) {
    throw new ResourceOperationError(
      400,
      `${field} must be ${LIMITS[field]} characters or fewer.`,
    );
  }

  return trimmed;
}

function optionalCapacity(input: Record<string, unknown>): number | null | undefined {
  if (!("capacity" in input)) {
    return undefined;
  }

  const value = input.capacity;

  if (value === null) {
    return null;
  }

  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new ResourceOperationError(
      400,
      "capacity must be a positive integer when supplied.",
    );
  }

  return Number(value);
}

function validateResourceInput(
  input: unknown,
  mode: "create" | "update",
): ResourceWriteData {
  const body = assertPlainObject(input);
  rejectUnknownFields(body, RESOURCE_INPUT_FIELDS);

  const data: ResourceWriteData = {};
  const name = requiredTrimmedString(body, "name", mode);
  const type = requiredTrimmedString(body, "type", mode);
  const description = optionalTrimmedString(body, "description");
  const location = optionalTrimmedString(body, "location");
  const capacity = optionalCapacity(body);

  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = type;
  if (description !== undefined) data.description = description;
  if (location !== undefined) data.location = location;
  if (capacity !== undefined) data.capacity = capacity;

  if (mode === "update" && Object.keys(data).length === 0) {
    throw new ResourceOperationError(400, "At least one resource field is required.");
  }

  return data;
}

function validateStatusInput(input: unknown): boolean {
  const body = assertPlainObject(input);
  rejectUnknownFields(body, STATUS_INPUT_FIELDS);

  if (typeof body.isActive !== "boolean") {
    throw new ResourceOperationError(400, "isActive must be a boolean.");
  }

  return body.isActive;
}

export function validateResourceId(id: string) {
  if (!UUID_PATTERN.test(id)) {
    throw new ResourceOperationError(400, "Resource id is malformed.");
  }
}

async function requireResourceUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new ResourceOperationError(401, "Authentication is required.");
  }

  return user;
}

async function requireResourceAdmin(): Promise<CurrentUser> {
  const user = await requireResourceUser();

  if (user.role !== "ADMIN") {
    throw new ResourceOperationError(403, "Administrator access is required.");
  }

  return user;
}

export async function listResourcesForCurrentUser() {
  const user = await requireResourceUser();
  const resources = await prisma.resource.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    where: user.role === "ADMIN" ? undefined : { isActive: true },
  });

  return resources.map(toResourceDto);
}

export async function getResourceDetails(id: string) {
  validateResourceId(id);

  const user = await requireResourceUser();
  const resource = await prisma.resource.findUnique({
    where: { id },
  });

  if (!resource || (user.role !== "ADMIN" && !resource.isActive)) {
    throw new ResourceOperationError(404, "Resource was not found.");
  }

  return toResourceDto(resource);
}

export async function createResource(input: unknown) {
  await requireResourceAdmin();

  const data = validateResourceInput(input, "create") as Required<
    Pick<ResourceWriteData, "name" | "type">
  > &
    ResourceWriteData;

  const resource = await prisma.resource.create({
    data: {
      capacity: data.capacity ?? null,
      description: data.description ?? null,
      location: data.location ?? null,
      name: data.name,
      type: data.type,
    },
  });

  return toResourceDto(resource);
}

export async function updateResource(id: string, input: unknown) {
  validateResourceId(id);
  await requireResourceAdmin();

  const data = validateResourceInput(input, "update");
  const existing = await prisma.resource.findUnique({
    select: { id: true },
    where: { id },
  });

  if (!existing) {
    throw new ResourceOperationError(404, "Resource was not found.");
  }

  const resource = await prisma.resource.update({
    data,
    where: { id },
  });

  return toResourceDto(resource);
}

export async function setResourceActiveState(id: string, input: unknown) {
  validateResourceId(id);
  await requireResourceAdmin();

  const isActive = validateStatusInput(input);
  const existing = await prisma.resource.findUnique({
    select: { id: true },
    where: { id },
  });

  if (!existing) {
    throw new ResourceOperationError(404, "Resource was not found.");
  }

  const resource = await prisma.resource.update({
    data: { isActive },
    where: { id },
  });

  return toResourceDto(resource);
}
