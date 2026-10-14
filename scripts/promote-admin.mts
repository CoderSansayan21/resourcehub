import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrismaClient } from "../src/generated/prisma/client";

type PromotionTarget = {
  email: string;
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
};

function assertSafeEnvironment() {
  const productionFlags = [
    process.env.NODE_ENV,
    process.env.VERCEL_ENV,
    process.env.APP_ENV,
  ];

  if (productionFlags.some((value) => value?.toLowerCase() === "production")) {
    throw new Error("Refusing to promote an admin in a production environment.");
  }
}

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to promote an admin.");
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

function requireEmailArgument() {
  const [, , rawEmail, ...extraArgs] = process.argv;
  const email = rawEmail?.trim().toLowerCase();

  if (!email || extraArgs.length > 0) {
    throw new Error("Usage: npm run admin:promote -- user@example.com");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid target user email is required.");
  }

  return email;
}

async function requirePromotionConfirmation(user: PromotionTarget) {
  const confirmationPhrase = `PROMOTE ${user.email}`;
  const readline = createInterface({ input, output });

  try {
    console.log("ADMIN promotion target:");
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Current role: ${user.role}`);
    console.log("");

    const answer = await readline.question(
      `Type "${confirmationPhrase}" to promote this MEMBER to ADMIN: `,
    );

    if (answer.trim() !== confirmationPhrase) {
      throw new Error("Promotion cancelled. Confirmation phrase did not match.");
    }
  } finally {
    readline.close();
  }
}

async function main() {
  assertSafeEnvironment();

  const email = requireEmailArgument();
  const connectionString = requireDatabaseUrl();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const beforeCounts = await prisma.$transaction([
      prisma.user.count(),
      prisma.reservation.count(),
    ]);

    const user = await prisma.user.findFirst({
      select: {
        email: true,
        id: true,
        name: true,
        role: true,
      },
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      throw new Error(
        `No registered user was found for ${email}. Register the account first, then run this command again.`,
      );
    }

    if (user.role === "ADMIN") {
      console.log(
        JSON.stringify(
          {
            changed: false,
            message: "User is already an ADMIN.",
            user: {
              email: user.email,
              id: user.id,
              name: user.name,
              role: user.role,
            },
          },
          null,
          2,
        ),
      );
      return;
    }

    if (user.role !== "MEMBER") {
      throw new Error(`Refusing to promote user with unsupported role: ${user.role}`);
    }

    await requirePromotionConfirmation(user);

    const promotion = await prisma.user.updateMany({
      data: {
        role: "ADMIN",
      },
      where: {
        id: user.id,
        role: "MEMBER",
      },
    });

    if (promotion.count !== 1) {
      throw new Error(
        "Promotion failed safely because the user was not still a MEMBER.",
      );
    }

    const promotedUser = await prisma.user.findUniqueOrThrow({
      select: {
        email: true,
        id: true,
        name: true,
        role: true,
      },
      where: {
        id: user.id,
      },
    });

    const afterCounts = await prisma.$transaction([
      prisma.user.count(),
      prisma.reservation.count(),
    ]);

    if (beforeCounts[0] !== afterCounts[0] || beforeCounts[1] !== afterCounts[1]) {
      throw new Error("Safety check failed: user or reservation counts changed.");
    }

    console.log(
      JSON.stringify(
        {
          changed: true,
          message: "User promoted to ADMIN.",
          user: promotedUser,
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
  console.error(error instanceof Error ? error.message : "Admin promotion failed.");
  process.exitCode = 1;
});
