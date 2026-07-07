import { prisma } from "../../lib/prisma";

export const authRepository = {
  findUserByClerkId(clerkId: string) {
    return prisma.user.findUnique({ where: { clerkId } });
  },

  findMembershipsForUser(userId: string) {
    return prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
  },

  findOrganizationBySlug(slug: string) {
    return prisma.organization.findUnique({ where: { slug } });
  },

  async upsertUserFromClerk(input: {
    clerkId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  }) {
    return prisma.user.upsert({
      where: { clerkId: input.clerkId },
      update: { email: input.email, fullName: input.fullName, avatarUrl: input.avatarUrl },
      create: input,
    });
  },

  // Wrapped in a transaction — an organization created without its owner
  // Membership (or vice versa) is an invalid, unrecoverable state.
  createOrganizationWithOwner(input: { name: string; slug: string; userId: string }) {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: input.name, slug: input.slug },
      });
      const membership = await tx.membership.create({
        data: { userId: input.userId, organizationId: organization.id, role: "ORG_OWNER" },
      });
      return { organization, membership };
    });
  },

  deleteUserByClerkId(clerkId: string) {
    return prisma.user.deleteMany({ where: { clerkId } });
  },
};