import "server-only";

import type { Reservation, Resource } from "@/generated/prisma/client";
import { ReservationStatus } from "@/generated/prisma/enums";
import type { CurrentUser } from "@/lib/authorization";
import { getCurrentUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ISO_WITH_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

const CREATE_FIELDS = [
  "endTime",
  "notes",
  "resourceId",
  "startTime",
  "title",
] as const;

const UPDATE_FIELDS = [
  "endTime",
  "notes",
  "resourceId",
  "startTime",
  "title",
] as const;

const LIMITS = {
  notes: 1000,
  title: 120,
} as const;

const MAX_RESERVATION_DURATION_MS = 8 * 60 * 60 * 1000;

type ReservationWithResource = Reservation & {
  resource: Pick<Resource, "id" | "name" | "type" | "location" | "capacity" | "isActive">;
};

type ReservationWriteData = {
  endTime?: Date;
  notes?: string | null;
  resourceId?: string;
  startTime?: Date;
  title?: string;
};

export type ReservationDto = {
  createdAt: string;
  endTime: string;
  id: string;
  notes: string | null;
  resource: {
    capacity: number | null;
    id: string;
    isActive: boolean;
    location: string | null;
    name: string;
    type: string;
  };
  resourceId: string;
  startTime: string;
  status: ReservationStatus;
  title: string;
  updatedAt: string;
  userId: string;
};

export class ReservationOperationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ReservationOperationError";
    this.status = status;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasPostgresCode(error: unknown, code: string, depth = 0): boolean {
  if (!isObject(error) || depth > 6) {
    return false;
  }

  if (error.code === code || error.sqlState === code || error.sqlstate === code) {
    return true;
  }

  return Object.values(error).some((value) =>
    isObject(value) ? hasPostgresCode(value, code, depth + 1) : false,
  );
}

function hasReservationOverlapConstraintName(error: unknown, depth = 0): boolean {
  if (depth > 6) {
    return false;
  }

  if (typeof error === "string") {
    return error.includes("Reservation_no_confirmed_overlap");
  }

  if (!isObject(error)) {
    return false;
  }

  return Object.values(error).some((value) =>
    hasReservationOverlapConstraintName(value, depth + 1),
  );
}

function mapReservationWriteError(error: unknown): never {
  if (
    hasPostgresCode(error, "23P01") ||
    hasReservationOverlapConstraintName(error)
  ) {
    throw new ReservationOperationError(
      409,
      "This resource already has a confirmed reservation during that time.",
    );
  }

  throw error;
}

function toReservationDto(reservation: ReservationWithResource): ReservationDto {
  return {
    createdAt: reservation.createdAt.toISOString(),
    endTime: reservation.endTime.toISOString(),
    id: reservation.id,
    notes: reservation.notes,
    resource: {
      capacity: reservation.resource.capacity,
      id: reservation.resource.id,
      isActive: reservation.resource.isActive,
      location: reservation.resource.location,
      name: reservation.resource.name,
      type: reservation.resource.type,
    },
    resourceId: reservation.resourceId,
    startTime: reservation.startTime.toISOString(),
    status: reservation.status,
    title: reservation.title,
    updatedAt: reservation.updatedAt.toISOString(),
    userId: reservation.userId,
  };
}

function assertPlainObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ReservationOperationError(400, "Request body must be an object.");
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
    throw new ReservationOperationError(
      400,
      "Request body contains unknown fields.",
    );
  }
}

function validateUuid(id: string, label: string) {
  if (!UUID_PATTERN.test(id)) {
    throw new ReservationOperationError(400, `${label} is malformed.`);
  }
}

function requiredUuid(input: Record<string, unknown>, field: "resourceId") {
  const value = input[field];

  if (typeof value !== "string") {
    throw new ReservationOperationError(400, `${field} is required.`);
  }

  validateUuid(value, field);
  return value;
}

function optionalUuid(input: Record<string, unknown>, field: "resourceId") {
  if (!(field in input)) {
    return undefined;
  }

  return requiredUuid(input, field);
}

function requiredText(input: Record<string, unknown>, field: "title") {
  const value = input[field];

  if (typeof value !== "string") {
    throw new ReservationOperationError(400, `${field} is required.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ReservationOperationError(400, `${field} is required.`);
  }

  if (trimmed.length > LIMITS[field]) {
    throw new ReservationOperationError(
      400,
      `${field} must be ${LIMITS[field]} characters or fewer.`,
    );
  }

  return trimmed;
}

function optionalText(
  input: Record<string, unknown>,
  field: "notes",
): string | null | undefined {
  if (!(field in input)) {
    return undefined;
  }

  const value = input[field];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ReservationOperationError(400, `${field} must be text when supplied.`);
  }

  const trimmed = value.trim();

  if (trimmed.length > LIMITS[field]) {
    throw new ReservationOperationError(
      400,
      `${field} must be ${LIMITS[field]} characters or fewer.`,
    );
  }

  return trimmed.length > 0 ? trimmed : null;
}

function optionalTitle(input: Record<string, unknown>) {
  if (!("title" in input)) {
    return undefined;
  }

  return requiredText(input, "title");
}

function parseRequiredDateTime(
  input: Record<string, unknown>,
  field: "endTime" | "startTime",
) {
  const value = input[field];

  if (typeof value !== "string") {
    throw new ReservationOperationError(400, `${field} is required.`);
  }

  return parseDateTime(value, field);
}

function parseOptionalDateTime(
  input: Record<string, unknown>,
  field: "endTime" | "startTime",
) {
  if (!(field in input)) {
    return undefined;
  }

  return parseRequiredDateTime(input, field);
}

function parseDateTime(value: string, field: string) {
  if (!ISO_WITH_TIMEZONE_PATTERN.test(value)) {
    throw new ReservationOperationError(
      400,
      `${field} must be an ISO date/time with an explicit timezone offset or UTC.`,
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ReservationOperationError(400, `${field} must be a valid date/time.`);
  }

  return date;
}

function validateTimeWindow(startTime: Date, endTime: Date) {
  if (startTime >= endTime) {
    throw new ReservationOperationError(
      400,
      "startTime must be earlier than endTime.",
    );
  }

  if (startTime <= new Date()) {
    throw new ReservationOperationError(400, "Reservations cannot start in the past.");
  }

  if (endTime.getTime() - startTime.getTime() > MAX_RESERVATION_DURATION_MS) {
    throw new ReservationOperationError(
      400,
      "Reservations cannot be longer than 8 hours.",
    );
  }
}

function validateCreateInput(input: unknown): Required<
  Pick<ReservationWriteData, "endTime" | "resourceId" | "startTime" | "title">
> &
  Pick<ReservationWriteData, "notes"> {
  const body = assertPlainObject(input);
  rejectUnknownFields(body, CREATE_FIELDS);

  const data = {
    endTime: parseRequiredDateTime(body, "endTime"),
    notes: optionalText(body, "notes"),
    resourceId: requiredUuid(body, "resourceId"),
    startTime: parseRequiredDateTime(body, "startTime"),
    title: requiredText(body, "title"),
  };

  validateTimeWindow(data.startTime, data.endTime);

  return data;
}

function validateUpdateInput(input: unknown): ReservationWriteData {
  const body = assertPlainObject(input);
  rejectUnknownFields(body, UPDATE_FIELDS);

  const data: ReservationWriteData = {};
  const title = optionalTitle(body);
  const notes = optionalText(body, "notes");
  const resourceId = optionalUuid(body, "resourceId");
  const startTime = parseOptionalDateTime(body, "startTime");
  const endTime = parseOptionalDateTime(body, "endTime");

  if (title !== undefined) data.title = title;
  if (notes !== undefined) data.notes = notes;
  if (resourceId !== undefined) data.resourceId = resourceId;
  if (startTime !== undefined) data.startTime = startTime;
  if (endTime !== undefined) data.endTime = endTime;

  if (Object.keys(data).length === 0) {
    throw new ReservationOperationError(
      400,
      "At least one reservation field is required.",
    );
  }

  return data;
}

async function requireReservationUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new ReservationOperationError(401, "Authentication is required.");
  }

  return user;
}

async function assertActiveResource(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    select: { id: true, isActive: true },
    where: { id: resourceId },
  });

  if (!resource || !resource.isActive) {
    throw new ReservationOperationError(
      404,
      "Active resource was not found.",
    );
  }
}

async function assertNoOverlap({
  endTime,
  excludeReservationId,
  resourceId,
  startTime,
}: {
  endTime: Date;
  excludeReservationId?: string;
  resourceId: string;
  startTime: Date;
}) {
  // Friendly early feedback only. The concurrency-safe guarantee is the
  // PostgreSQL exclusion constraint Reservation_no_confirmed_overlap.
  const overlappingReservation = await prisma.reservation.findFirst({
    select: { id: true },
    where: {
      endTime: { gt: startTime },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      resourceId,
      startTime: { lt: endTime },
      status: ReservationStatus.CONFIRMED,
    },
  });

  if (overlappingReservation) {
    throw new ReservationOperationError(
      409,
      "This resource already has a confirmed reservation during that time.",
    );
  }
}

async function findVisibleReservation(id: string, user: CurrentUser) {
  validateUuid(id, "Reservation id");

  const reservation = await prisma.reservation.findFirst({
    include: {
      resource: {
        select: {
          capacity: true,
          id: true,
          isActive: true,
          location: true,
          name: true,
          type: true,
        },
      },
    },
    where: user.role === "ADMIN" ? { id } : { id, userId: user.id },
  });

  if (!reservation) {
    throw new ReservationOperationError(404, "Reservation was not found.");
  }

  return reservation;
}

async function findOwnedReservation(id: string, user: CurrentUser) {
  validateUuid(id, "Reservation id");

  const reservation = await prisma.reservation.findUnique({
    include: {
      resource: {
        select: {
          capacity: true,
          id: true,
          isActive: true,
          location: true,
          name: true,
          type: true,
        },
      },
    },
    where: { id },
  });

  if (!reservation) {
    throw new ReservationOperationError(404, "Reservation was not found.");
  }

  if (reservation.userId !== user.id) {
    // Stage 6 Step 1 grants admins read-only cross-user access. Arbitrary
    // admin edits/cancellations are intentionally not enabled yet.
    throw new ReservationOperationError(
      403,
      "Only the reservation owner can modify this reservation.",
    );
  }

  return reservation;
}

export async function listReservationsForCurrentUser() {
  const user = await requireReservationUser();
  const reservations = await prisma.reservation.findMany({
    include: {
      resource: {
        select: {
          capacity: true,
          id: true,
          isActive: true,
          location: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    where: user.role === "ADMIN" ? undefined : { userId: user.id },
  });

  return reservations.map(toReservationDto);
}

export async function getReservationDetails(id: string) {
  const user = await requireReservationUser();
  const reservation = await findVisibleReservation(id, user);

  return toReservationDto(reservation);
}

export async function createReservation(input: unknown) {
  const user = await requireReservationUser();
  const data = validateCreateInput(input);

  await assertActiveResource(data.resourceId);
  await assertNoOverlap({
    endTime: data.endTime,
    resourceId: data.resourceId,
    startTime: data.startTime,
  });

  try {
    const reservation = await prisma.reservation.create({
      data: {
        endTime: data.endTime,
        notes: data.notes ?? null,
        resourceId: data.resourceId,
        startTime: data.startTime,
        status: ReservationStatus.CONFIRMED,
        title: data.title,
        userId: user.id,
      },
      include: {
        resource: {
          select: {
            capacity: true,
            id: true,
            isActive: true,
            location: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return toReservationDto(reservation);
  } catch (error) {
    mapReservationWriteError(error);
  }
}

export async function updateReservation(id: string, input: unknown) {
  const user = await requireReservationUser();
  const data = validateUpdateInput(input);
  const existing = await findOwnedReservation(id, user);

  if (existing.status !== ReservationStatus.CONFIRMED) {
    throw new ReservationOperationError(
      409,
      "Only confirmed reservations can be updated.",
    );
  }

  if (existing.startTime <= new Date()) {
    throw new ReservationOperationError(
      409,
      "Only future reservations can be updated.",
    );
  }

  const nextResourceId = data.resourceId ?? existing.resourceId;
  const nextStartTime = data.startTime ?? existing.startTime;
  const nextEndTime = data.endTime ?? existing.endTime;

  validateTimeWindow(nextStartTime, nextEndTime);
  await assertActiveResource(nextResourceId);
  await assertNoOverlap({
    endTime: nextEndTime,
    excludeReservationId: existing.id,
    resourceId: nextResourceId,
    startTime: nextStartTime,
  });

  try {
    const reservation = await prisma.reservation.update({
      data,
      include: {
        resource: {
          select: {
            capacity: true,
            id: true,
            isActive: true,
            location: true,
            name: true,
            type: true,
          },
        },
      },
      where: { id },
    });

    return toReservationDto(reservation);
  } catch (error) {
    mapReservationWriteError(error);
  }
}

export async function cancelReservation(id: string) {
  const user = await requireReservationUser();
  const existing = await findOwnedReservation(id, user);

  if (existing.status === ReservationStatus.CANCELLED) {
    return toReservationDto(existing);
  }

  const reservation = await prisma.reservation.update({
    data: { status: ReservationStatus.CANCELLED },
    include: {
      resource: {
        select: {
          capacity: true,
          id: true,
          isActive: true,
          location: true,
          name: true,
          type: true,
        },
      },
    },
    where: { id },
  });

  return toReservationDto(reservation);
}
