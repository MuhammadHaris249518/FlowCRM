import { z } from "zod";

export const companyFormSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  domain: z.string().trim().max(200).optional().or(z.literal("")),
  industry: z.string().trim().max(100).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(300)
    .optional()
    .or(z.literal("")),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const contactFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  email: z.string().trim().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  title: z.string().trim().max(150).optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
