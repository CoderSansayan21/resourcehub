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

export type DashboardAdminReservationSummary = DashboardReservationSummary & {
  createdAt: string;
  status: ReservationStatus;
  user: {
    email: string;
    name: string;
  };
};

export type DashboardResourceSummary = {
  capacity: number | null;
  id: string;
  location: string | null;
  name: string;
  type: string;
};

export type DashboardData = {
  activeResourceCount: number;
  activeResources: DashboardResourceSummary[];
  currentUser: {
    id: string;
    name: string;
    role: "ADMIN" | "MEMBER";
  };
  nextReservation: DashboardReservationSummary | null;
  inactiveResourceCount?: number;
  recentReservations?: DashboardAdminReservationSummary[];
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

const adminReservationSelect = {
  createdAt: true,
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
  status: true,
  title: true,
  user: {
    select: {
      email: true,
      name: true,
    },
  },
} as const;

const activeResourceSelect = {
  capacity: true,
  id: true,
  location: true,
  name: true,
  type: true,
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
    const [
      totalResourceCount,
      activeResourceCount,
      inactiveResourceCount,
      activeResources,
      upcomingConfirmedCount,
      upcoming,
      recent,
    ] = await Promise.all([
      prisma.resource.count(),
      prisma.resource.count({ where: { isActive: true } }),
      prisma.resource.count({ where: { isActive: false } }),
        prisma.resource.findMany({
          orderBy: [{ name: "asc" }, { createdAt: "desc" }],
          select: activeResourceSelect,
          take: 4,
          where: { isActive: true },
        }),
        prisma.reservation.count({ where: upcomingWhere }),
        prisma.reservation.findMany({
          orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
          select: reservationSelect,
          take: 5,
          where: upcomingWhere,
        }),
      prisma.reservation.findMany({
        orderBy: [{ createdAt: "desc" }, { startTime: "asc" }],
        select: adminReservationSelect,
        take: 5,
      }),
    ]);

    const upcomingReservations = upcoming.map(toReservationSummary);

    return {
      activeResourceCount,
      activeResources,
      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      inactiveResourceCount,
      nextReservation: upcomingReservations[0] ?? null,
      recentReservations: recent.map((reservation) => ({
        createdAt: reservation.createdAt.toISOString(),
        endTime: reservation.endTime.toISOString(),
        id: reservation.id,
        resource: reservation.resource,
        startTime: reservation.startTime.toISOString(),
        status: reservation.status,
        title: reservation.title,
        user: reservation.user,
      })),
      totalResourceCount,
      upcomingConfirmedCount,
      upcomingReservations,
    };
  }

  const [activeResourceCount, activeResources, upcomingConfirmedCount, upcoming] =
    await Promise.all([
      prisma.resource.count({ where: { isActive: true } }),
      prisma.resource.findMany({
        orderBy: [{ name: "asc" }, { createdAt: "desc" }],
        select: activeResourceSelect,
        take: 4,
        where: { isActive: true },
      }),
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
    activeResources,
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
