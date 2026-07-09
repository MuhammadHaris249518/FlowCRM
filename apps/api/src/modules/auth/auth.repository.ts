import { User, Organization, Membership } from "../../models";

export const authRepository = {
  findUserByClerkId(clerkId: string) {
    return User.findOne({ clerkId }).exec();
  },

  findMembershipsForUser(userId: string) {
    return Membership.find({ userId })
      .populate("organization")
      .sort({ createdAt: 1 })
      .exec();
  },

  findOrganizationBySlug(slug: string) {
    return Organization.findOne({ slug }).exec();
  },

  async upsertUserFromClerk(input: {
    clerkId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  }) {
    return User.findOneAndUpdate(
      { clerkId: input.clerkId },
      {
        email: input.email,
        fullName: input.fullName,
        avatarUrl: input.avatarUrl,
      },
      { new: true, upsert: true }
    ).exec();
  },

  async createOrganizationWithOwner(input: { name: string; slug: string; userId: string }) {
    const organization = new Organization({
      name: input.name,
      slug: input.slug,
    });
    await organization.save();

    const membership = new Membership({
      userId: input.userId,
      organizationId: organization._id.toString(),
      role: "ORG_OWNER",
    });
    await membership.save();

    return { organization, membership };
  },

  deleteUserByClerkId(clerkId: string) {
    return User.deleteMany({ clerkId }).exec();
  },
};