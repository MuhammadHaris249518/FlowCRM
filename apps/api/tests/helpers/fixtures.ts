import { randomUUID } from "crypto";
import type { Role } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";

export interface TestUser {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface TestOrgContext {
  organizationId: string;
  users: TestUser[];
}

function suffix(): string {
  return randomUUID().slice(0, 8);
}

export async function createTestOrganization(name = "Test Org") {
  return prisma.organization.create({
    data: {
      name: `${name} ${suffix()}`,
      // "test-" prefix makes these instantly identifiable/greppable in the
      // real dev DB if cleanup ever fails to run (e.g. a crashed test run).
      slug: `test-${suffix()}`,
    },
  });
}

export async function createTestUser(fullName = "Test User") {
  const s = suffix();
  return prisma.user.create({
    data: {
      clerkId: `test_clerk_${s}`,
      email: `test-${s}@flowcrm-tests.local`,
      fullName,
    },
  });
}

export async function addMembership(userId: string, organizationId: string, role: Role) {
  return prisma.membership.create({ data: { userId, organizationId, role } });
}

/**
 * Creates one Organization plus one User+Membership per role passed in, e.g.
 *   setupOrgWithUsers(["SALES_MANAGER", "SALES_REP", "SALES_REP"])
 * gives a manager and two reps in the same org — the standard shape needed
 * for RBAC scoping tests. Order of `users` matches the order of `roles`.
 */
export async function setupOrgWithUsers(roles: Role[]): Promise<TestOrgContext> {
  const org = await createTestOrganization();
  const users: TestUser[] = [];

  for (const role of roles) {
    const user = await createTestUser(`Test ${role}`);
    await addMembership(user.id, org.id, role);
    users.push({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      fullName: user.fullName,
      role,
    });
  }

  return { organizationId: org.id, users };
}

/**
 * Deletes the org — cascades to memberships, contacts, leads, deals, tasks,
 * activities (see schema.prisma onDelete: Cascade) — then deletes the users
 * themselves. Call this in afterEach or afterAll for every test that calls
 * setupOrgWithUsers, or you'll leave junk rows in the real dev DB.
 */
export async function cleanupTestContext(ctx: TestOrgContext) {
  await prisma.organization.delete({ where: { id: ctx.organizationId } }).catch(() => undefined);
  for (const user of ctx.users) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }
}

export async function createTestContact(
  organizationId: string,
  opts: { fullName?: string; ownerId?: string } = {}
) {
  return prisma.contact.create({
    data: {
      organizationId,
      fullName: opts.fullName ?? `Test Contact ${suffix()}`,
      ownerId: opts.ownerId,
    },
  });
}

/** Standard request headers for a given test user acting inside an org. */
export function authHeaders(user: TestUser, organizationId: string) {
  return {
    Authorization: `Bearer fake-token-for-tests`, // value is irrelevant — getAuth() is mocked
    "X-Organization-Id": organizationId,
  };
}
