import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type BetterAuthSessionUser = {
  id: string;
  email: string;
  name: string;
  role?: UserRole | null;
};

function toCurrentUser(user: BetterAuthSessionUser): CurrentUser {
  return {
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role ?? "MEMBER",
  };
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return toCurrentUser(session.user as BetterAuthSessionUser);
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== role) {
    forbidden();
  }

  return user;
}

/**
 * Authorization note for future mutations:
 * every resource and reservation Server Action or Route Handler must call
 * requireUser() or requireRole() again on the server before reading or writing
 * data. Client navigation state, form fields, headers, and hidden inputs are not
 * authorization inputs.
 */
