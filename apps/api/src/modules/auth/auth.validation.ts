import { z } from "zod";

// Slug becomes the workspace's URL segment (and future subdomain) — keep it
// strictly lowercase/hyphenated so it's safe in URLs without encoding.
export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Workspace name is too short").max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;