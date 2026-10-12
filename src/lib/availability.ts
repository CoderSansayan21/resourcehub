import "server-only";

import { ReservationStatus } from "@/generated/prisma/enums";
import type { CurrentUser } from "@/lib/authorization";
import { getCurrentUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAST_DAYS = 30;
const MAX_FUTURE_DAYS = 365;

type ZonedParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
};

export type AvailabilityIntervalDto = {
  endTime: string;
  startTime: string;
};

export type AvailabilityDto = {
  date: string;
  dayEnd: string;
  dayStart: string;
  free: AvailabilityIntervalDto[];
  occupied: AvailabilityIntervalDto[];
  resource: {
    id: string;
    isActive: boolean;
    location: string | null;
    name: string;
    type: string;
  };
  timeZone: string;
};

export class AvailabilityOperationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AvailabilityOperationError";
    this.status = status;
  }
}

function requireAvailabilityUser(): Promise<CurrentUser> {
  return getCurrentUser().then((user) => {
    if (!user) {
      throw new AvailabilityOperationError(401, "Authentication is required.");
    }

    return user;
  });
}

function validateUuid(id: string) {
  if (!UUID_PATTERN.test(id)) {
    throw new AvailabilityOperationError(400, "resourceId is malformed.");
  }
}

function validateDate(date: string) {
  if (!DATE_PATTERN.test(date)) {
    throw new AvailabilityOperationError(400, "date must use YYYY-MM-DD.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new AvailabilityOperationError(400, "date must be a valid calendar date.");
  }
}

function validateTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
  } catch {
    throw new AvailabilityOperationError(400, "timeZone must be a valid IANA timezone.");
  }
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en", {
    calendar: "gregory",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    day: lookup.day,
    hour: lookup.hour,
    minute: lookup.minute,
    month: lookup.month,
    second: lookup.second,
    year: lookup.year,
  };
}

function zonedDateTimeToUtc({
  day,
  hour = 0,
  minute = 0,
  month,
  second = 0,
  timeZone,
  year,
}: {
  day: number;
  hour?: number;
  minute?: number;
  month: number;
  second?: number;
  timeZone: string;
  year: number;
}) {
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = new Date(targetUtc);

  for (let index = 0; index < 4; index += 1) {
    const parts = getZonedParts(instant, timeZone);
    const localAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const diff = localAsUtc - targetUtc;

    if (diff === 0) {
      return instant;
    }

    instant = new Date(instant.getTime() - diff);
  }

  const parts = getZonedParts(instant, timeZone);
  if (
    parts.year === year &&
    parts.month === month &&
    parts.day === day &&
    parts.hour === hour &&
    parts.minute === minute &&
    parts.second === second
  ) {
    return instant;
  }

  throw new AvailabilityOperationError(
    400,
    "date cannot be resolved in the selected timezone.",
  );
}

function addOneCalendarDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
}

function getDayBounds(date: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const next = addOneCalendarDay(date);

  return {
    dayEnd: zonedDateTimeToUtc({ ...next, timeZone }),
    dayStart: zonedDateTimeToUtc({ day, month, timeZone, year }),
  };
}

function assertReasonableDateRange(dayStart: Date) {
  const now = new Date();
  const pastLimit = new Date(now.getTime() - MAX_PAST_DAYS * 24 * 60 * 60 * 1000);
  const futureLimit = new Date(
    now.getTime() + MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000,
  );

  if (dayStart < pastLimit || dayStart > futureLimit) {
    throw new AvailabilityOperationError(
      400,
      `date must be within ${MAX_PAST_DAYS} days past and ${MAX_FUTURE_DAYS} days future.`,
    );
  }
}

function toInterval(startTime: Date, endTime: Date): AvailabilityIntervalDto {
  return {
    endTime: endTime.toISOString(),
    startTime: startTime.toISOString(),
  };
}

function getFreeIntervals({
  dayEnd,
  dayStart,
  occupied,
}: {
  dayEnd: Date;
  dayStart: Date;
  occupied: Array<{ endTime: Date; startTime: Date }>;
}) {
  const free: AvailabilityIntervalDto[] = [];
  let cursor = dayStart;

  for (const interval of occupied) {
    if (cursor < interval.startTime) {
      free.push(toInterval(cursor, interval.startTime));
    }

    if (cursor < interval.endTime) {
      cursor = interval.endTime;
    }
  }

  if (cursor < dayEnd) {
    free.push(toInterval(cursor, dayEnd));
  }

  return free;
}

export async function getResourceAvailability({
  date,
  resourceId,
  timeZone,
}: {
  date: string;
  resourceId: string;
  timeZone: string;
}): Promise<AvailabilityDto> {
  validateUuid(resourceId);
  validateDate(date);
  validateTimeZone(timeZone);

  const user = await requireAvailabilityUser();
  const { dayEnd, dayStart } = getDayBounds(date, timeZone);
  assertReasonableDateRange(dayStart);

  const resource = await prisma.resource.findUnique({
    select: {
      id: true,
      isActive: true,
      location: true,
      name: true,
      type: true,
    },
    where: { id: resourceId },
  });

  if (!resource || (user.role !== "ADMIN" && !resource.isActive)) {
    throw new AvailabilityOperationError(404, "Resource was not found.");
  }

  const reservations = await prisma.$queryRaw<
    Array<{ endMs: number; startMs: number }>
  >`
    SELECT
      (extract(epoch from "startTime") * 1000)::double precision AS "startMs",
      (extract(epoch from "endTime") * 1000)::double precision AS "endMs"
    FROM "Reservation"
    WHERE "resourceId" = ${resourceId}::uuid
      AND "status" = ${ReservationStatus.CONFIRMED}::"ReservationStatus"
      AND "endTime" > ${dayStart.toISOString()}::timestamptz
      AND "startTime" < ${dayEnd.toISOString()}::timestamptz
    ORDER BY "startTime" ASC, "endTime" ASC
  `;

  const occupied = reservations.map((reservation) => ({
    endTime:
      reservation.endMs < dayEnd.getTime()
        ? new Date(reservation.endMs)
        : dayEnd,
    startTime:
      reservation.startMs > dayStart.getTime()
        ? new Date(reservation.startMs)
        : dayStart,
  }));

  return {
    date,
    dayEnd: dayEnd.toISOString(),
    dayStart: dayStart.toISOString(),
    free: getFreeIntervals({ dayEnd, dayStart, occupied }),
    occupied: occupied.map((interval) =>
      toInterval(interval.startTime, interval.endTime),
    ),
    resource,
    timeZone,
  };
}
