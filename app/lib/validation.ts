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

// A writing-room blog post (markdown body).
export const postInputSchema = z.object({
  title: z.string().min(1, "Give it a title.").max(200).trim(),
  content: z.string().max(100_000).default(""),
  published: z.boolean().default(true),
});

// A sticky note on the hobby board.
export const ideaInputSchema = z.object({
  bucket: z.enum(["read", "write", "explore", "solve"]),
  text: z.string().min(1, "Write something on the note.").max(500).trim(),
});

// A daily-room habit tick: one per habit per (visitor-local) day.
export const dailyTickSchema = z.object({
  kind: z.enum(["article", "spanish", "listening"]),
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Day must look like 2026-07-23."),
});

// A frame on the hallway wall (job / project / achievement),
// or a hand-built sandbox project shelved in the workshop.
export const frameInputSchema = z.object({
  kind: z.enum(["job", "project", "achievement", "sandbox"]),
  title: z.string().min(1, "Give it a title.").max(120).trim(),
  subtitle: z.string().max(600).trim().default(""),
  detail: z.string().max(2000).trim().default(""),
  years: z.string().max(40).trim().nullish(),
  link: z.url("Links need to be full URLs.").nullish().or(z.literal("")),
  sort: z.number().int().default(0),
});
