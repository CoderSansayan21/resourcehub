import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type SampleResource = {
  capacity: number;
  description: string;
  location: string;
  name: string;
  type: "meeting-rooms" | "equipment" | "workspaces" | "computer-labs" | "others";
};

const SAMPLE_RESOURCES: SampleResource[] = [
  {
    capacity: 12,
    description:
      "A polished conference room for team planning, client meetings, and hybrid discussions.",
    location: "Administration Building, Level 2, Room 204",
    name: "Conference Room A",
    type: "meeting-rooms",
  },
  {
    capacity: 20,
    description:
      "A spacious boardroom with executive seating for department reviews and formal presentations.",
    location: "Administration Building, Level 3, Room 301",
    name: "Boardroom B",
    type: "meeting-rooms",
  },
  {
    capacity: 1,
    description:
      "Portable HD projector suitable for training sessions, workshops, and classroom presentations.",
    location: "IT Services Store, Equipment Shelf E1",
    name: "Projector 01",
    type: "equipment",
  },
  {
    capacity: 1,
    description:
      "All-in-one video conferencing kit with camera, speakerphone, and room microphone.",
    location: "IT Services Store, Equipment Shelf E2",
    name: "Video Conference Kit",
    type: "equipment",
  },
  {
    capacity: 1,
    description:
      "Quiet individual desk for focused work, remote meetings, or short-term hot desking.",
    location: "Workspace Hub, Level 1, Desk F01",
    name: "Focus Desk 01",
    type: "workspaces",
  },
  {
    capacity: 8,
    description:
      "Open collaboration zone with flexible seating for brainstorming and small team check-ins.",
    location: "Workspace Hub, Level 1, North Collaboration Zone",
    name: "Collaboration Area",
    type: "workspaces",
  },
  {
    capacity: 24,
    description:
      "Computer lab configured for instructor-led training, software demos, and assessment sessions.",
    location: "Technology Block, Level 2, Lab 2A",
    name: "Training Lab A",
    type: "computer-labs",
  },
  {
    capacity: 6,
    description:
      "Studio space with controlled lighting for staff portraits, product photos, and media projects.",
    location: "Media Center, Ground Floor, Studio 01",
    name: "Photography Studio",
    type: "others",
  },
];

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the seed script.");
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  return databaseUrl;
}

function assertSafeEnvironment() {
  const productionFlags = [
    process.env.NODE_ENV,
    process.env.VERCEL_ENV,
    process.env.APP_ENV,
  ];

  if (productionFlags.some((value) => value?.toLowerCase() === "production")) {
    throw new Error("Refusing to run database seed in a production environment.");
  }
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  assertSafeEnvironment();

  const connectionString = requireDatabaseUrl();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const beforeCounts = await prisma.$transaction([
      prisma.user.count(),
      prisma.reservation.count(),
    ]);

    const existingResources = await prisma.resource.findMany({
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    const existingByNormalizedName = new Map(
      existingResources.map((resource) => [normalizeName(resource.name), resource]),
    );

    const created: string[] = [];
    const skipped: string[] = [];

    for (const resource of SAMPLE_RESOURCES) {
      const existing = existingByNormalizedName.get(normalizeName(resource.name));

      if (existing) {
        skipped.push(`${resource.name} (existing ${existing.type})`);
        continue;
      }

      const createdResource = await prisma.resource.create({
        data: {
          capacity: resource.capacity,
          description: resource.description,
          isActive: true,
          location: resource.location,
          name: resource.name,
          type: resource.type,
        },
        select: {
          name: true,
        },
      });

      existingByNormalizedName.set(normalizeName(resource.name), {
        id: "",
        name: resource.name,
        type: resource.type,
      });
      created.push(createdResource.name);
    }

    const afterCounts = await prisma.$transaction([
      prisma.user.count(),
      prisma.reservation.count(),
    ]);

    if (beforeCounts[0] !== afterCounts[0] || beforeCounts[1] !== afterCounts[1]) {
      throw new Error("Seed safety check failed: user or reservation counts changed.");
    }

    console.log(
      JSON.stringify(
        {
          created,
          skipped,
          summary: {
            created: created.length,
            skipped: skipped.length,
            usersUnchanged: afterCounts[0],
            reservationsUnchanged: afterCounts[1],
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exitCode = 1;
});
