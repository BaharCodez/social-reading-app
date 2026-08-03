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

// Freeform topic labels: trimmed, de-duplicated (case-insensitive), capped.
export const tagsSchema = z
  .array(z.string())
  .default([])
  .transform((tags) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of tags) {
      const tag = raw.trim().replace(/\s+/g, " ").slice(0, 40);
      const key = tag.toLowerCase();
      if (tag && !seen.has(key)) {
        seen.add(key);
        out.push(tag);
      }
    }
    return out.slice(0, 12);
  });

// A writing-room blog post (markdown body).
export const postInputSchema = z.object({
  title: z.string().min(1, "Give it a title.").max(200).trim(),
  content: z.string().max(100_000).default(""),
  tags: tagsSchema,
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
  kind: z.enum(["job", "gig", "project", "achievement", "sandbox"]),
  title: z.string().min(1, "Give it a title.").max(120).trim(),
  subtitle: z.string().max(600).trim().default(""),
  detail: z.string().max(2000).trim().default(""),
  years: z.string().max(40).trim().nullish(),
  link: z.url("Links need to be full URLs.").nullish().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  sort: z.number().int().default(0),
});

// An article shelved in the daily room.
export const bookmarkInputSchema = z.object({
  url: z.url("A bookmark needs a full URL."),
  title: z.string().min(1, "Give it a title.").max(300).trim(),
  source: z.string().max(120).trim().default(""),
  favorite: z.boolean().default(false),
});
