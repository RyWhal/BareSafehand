import { z } from "zod";

export const issueCodeSchema = z.enum([
  "BAD_REQUEST",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "UNSUPPORTED_RULE",
  "GM_CONFIRMATION_REQUIRED"
]);

export const issueSchema = z.object({
  code: issueCodeSchema,
  message: z.string().min(1),
  path: z.array(z.union([z.string(), z.number()])).default([]),
  context: z.record(z.string(), z.unknown()).default({})
});

export const warningSchema = issueSchema;

export type IssueCode = z.infer<typeof issueCodeSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type Warning = z.infer<typeof warningSchema>;
