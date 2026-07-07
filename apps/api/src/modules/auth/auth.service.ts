import { AppError } from "../../errors/app-error";
import { authRepository } from "./auth.repository";
import type { CreateOrganizationInput } from "./auth.validation";
import type { MeDTO } from "./auth.types";

export const authService = {
  async getMe(clerkId: string): Promise<MeDTO> {
    const user = await authRepository.findUserByClerkId(clerkId);
    if (!user) {
      throw AppError.notFound("User record not found. Please complete onboarding.");
    }

    const memberships = await authRepository.findMembershipsForUser(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
      activeOrganizationId: memberships[0]?.organization.id ?? null,
    };
  },

  async createOrganization(clerkId: string, input: CreateOrganizationInput) {
    const user = await authRepository.findUserByClerkId(clerkId);
    if (!user) {
      throw AppError.notFound("User record not found. Please complete onboarding.");
    }

    const existing = await authRepository.findOrganizationBySlug(input.slug);
    if (existing) {
      throw AppError.badRequest("This workspace URL is already taken", "SLUG_TAKEN");
    }

    const { organization, membership } = await authRepository.createOrganizationWithOwner({
      name: input.name,
      slug: input.slug,
      userId: user.id,
    });

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: membership.role,
    };
  },

  // Called from the Clerk webhook on user.created / user.updated — keeps our
  // User table in sync with Clerk as the source of truth for identity.
  async syncUserFromClerkWebhook(payload: {
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  }) {
    const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.email;
    return authRepository.upsertUserFromClerk({
      clerkId: payload.clerkId,
      email: payload.email,
      fullName,
      avatarUrl: payload.avatarUrl,
    });
  },

  async deleteUserFromClerkWebhook(clerkId: string) {
    return authRepository.deleteUserByClerkId(clerkId);
  },
};