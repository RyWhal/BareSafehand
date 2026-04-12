import { z } from "zod";

export const verificationStatusSchema = z.enum(["verified", "partial", "unavailable"]);

const baseContentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source_book: z.string().nullable(),
  source_page: z.union([z.string(), z.number()]).nullable(),
  verification_status: verificationStatusSchema,
  notes: z.string().nullable()
});

export const ancestrySchema = baseContentSchema.extend({
  benefits: z
    .object({
      bonus_talent: z
        .object({
          type: z.literal("bonus_talent"),
          notes: z.string()
        })
        .optional(),
      granted_talent_ids: z.array(z.string()).optional(),
      starting_form_packages: z
        .array(
          z.object({
            name: z.string(),
            talent_ids: z.array(z.string())
          })
        )
        .optional(),
      change_form_targets: z.array(z.string()).optional()
    })
    .optional()
});

export const heroicPathSchema = baseContentSchema.extend({
  starting_skill_id: z.string().min(1),
  key_talent_id: z.string().min(1)
});

export const skillSchema = baseContentSchema;

export const expertiseSchema = baseContentSchema;

export const talentSchema = baseContentSchema.extend({
  path_id: z.string().min(1).optional()
});

export const startingKitSchema = baseContentSchema.extend({
  contents: z.object({
    confirmed: z.array(z.string()).nullable().optional(),
    unknown: z.array(z.string()).nullable().optional()
  })
});

export const advancementRulesSchema = baseContentSchema.extend({
  incomplete: z.literal(true)
});

export const ancestryListSchema = z.array(ancestrySchema);
export const heroicPathListSchema = z.array(heroicPathSchema);
export const skillListSchema = z.array(skillSchema);
export const expertiseListSchema = z.array(expertiseSchema);
export const talentListSchema = z.array(talentSchema);
export const startingKitListSchema = z.array(startingKitSchema);

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type Ancestry = z.infer<typeof ancestrySchema>;
export type HeroicPath = z.infer<typeof heroicPathSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Expertise = z.infer<typeof expertiseSchema>;
export type Talent = z.infer<typeof talentSchema>;
export type StartingKit = z.infer<typeof startingKitSchema>;
export type AdvancementRules = z.infer<typeof advancementRulesSchema>;

export const contentRegistrySchema = z.object({
  ancestries: ancestryListSchema,
  heroicPaths: heroicPathListSchema,
  skills: skillListSchema,
  expertises: expertiseListSchema,
  talents: talentListSchema,
  startingKits: startingKitListSchema,
  advancementRules: advancementRulesSchema
});

export type ContentRegistry = z.infer<typeof contentRegistrySchema>;
