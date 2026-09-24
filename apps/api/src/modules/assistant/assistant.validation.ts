import { z } from "zod";

export const assistantChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(8000),
});

export const assistantChatBodySchema = z
  .object({
    messages: z.array(assistantChatMessageSchema).min(1).max(20),
  })
  .refine((data) => data.messages[data.messages.length - 1]?.role === "user", {
    message: "The last message must be from the user",
    path: ["messages"],
  });

export type AssistantChatBody = z.infer<typeof assistantChatBodySchema>;
