import "server-only";

import { ReservationStatus } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export type DashboardReservationSummary = {
  endTime: string;
  id: string;
  resource: {
    id: string;
    location: string | null;
    name: string;
    type: string;
  };
  startTime: string;
  title: string;
};

export type DashboardData = {
  activeResourceCount: number;
  currentUser: {
    id: string;
    name: string;
    role: "ADMIN" | "MEMBER";
  };
  nextReservation: DashboardReservationSummary | null;
  totalResourceCount?: number;
  upcomingConfirmedCount: number;
  upcomingReservations: DashboardReservationSummary[];
};

const reservationSelect = {
  endTime: true,
  id: true,
  resource: {
    select: {
      id: true,
      location: true,
      name: true,
      type: true,
    },
  },
  startTime: true,
  title: true,
} as const;

function toReservationSummary(reservation: {
  endTime: Date;
  id: string;
  resource: {
    id: string;
    location: string | null;
    name: string;
    type: string;
  };
  startTime: Date;
  title: string;
}): DashboardReservationSummary {
  return {
    endTime: reservation.endTime.toISOString(),
    id: reservation.id,
    resource: reservation.resource,
    startTime: reservation.startTime.toISOString(),
    title: reservation.title,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await requireUser();
  const now = new Date();
  const upcomingWhere = {
    startTime: { gt: now },
    status: ReservationStatus.CONFIRMED,
    ...(user.role === "ADMIN" ? {} : { userId: user.id }),
  };

  if (user.role === "ADMIN") {
    const [totalResourceCount, activeResourceCount, upcomingConfirmedCount, upcoming] =
      await Promise.all([
        prisma.resource.count(),
        prisma.resource.count({ where: { isActive: true } }),
        prisma.reservation.count({ where: upcomingWhere }),
        prisma.reservation.findMany({
          orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
          select: reservationSelect,
          take: 5,
          where: upcomingWhere,
        }),
      ]);

    const upcomingReservations = upcoming.map(toReservationSummary);

    return {
      activeResourceCount,
      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      nextReservation: upcomingReservations[0] ?? null,
      totalResourceCount,
      upcomingConfirmedCount,
      upcomingReservations,
    };
  }

  const [activeResourceCount, upcomingConfirmedCount, upcoming] = await Promise.all([
    prisma.resource.count({ where: { isActive: true } }),
    prisma.reservation.count({ where: upcomingWhere }),
    prisma.reservation.findMany({
      orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
      select: reservationSelect,
      take: 4,
      where: upcomingWhere,
    }),
  ]);

  const upcomingReservations = upcoming.map(toReservationSummary);

  return {
    activeResourceCount,
    currentUser: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    nextReservation: upcomingReservations[0] ?? null,
    upcomingConfirmedCount,
    upcomingReservations,
  };
}