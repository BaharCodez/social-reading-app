import * as z from "zod";

export const credentialsSchema = z.object({
  email: z.email("Please enter a valid email.").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signupSchema = credentialsSchema.extend({
  name: z.string().min(1, "Please enter your name.").trim(),
});

export const annotationInputSchema = z.object({
  cfiRange: z.string().min(1),
  text: z.string().min(1),
  comment: z.string().max(5000).default(""),
});
