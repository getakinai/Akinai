import { z } from 'zod'

const ThemeSectionDataSchema = z.object({
  type: z.string(),
  settings: z.record(z.string(), z.unknown()).optional(),
  blocks: z.record(z.string(), z.unknown()).optional(),
  blockOrder: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
})

export const ThemeSettingsDataSchema = z.object({
  current: z.record(z.string(), z.unknown()),
  sections: z.record(z.string(), ThemeSectionDataSchema),
})

export const ThemeTemplateDataSchema = z.object({
  sections: z.record(z.string(), ThemeSectionDataSchema),
  order: z.array(z.string()),
})

export const ThemeSettingDefinitionSchema = z.object({
  type: z.string(),
  id: z.string().optional(),
  label: z.string().optional(),
  content: z.string().optional(),
  default: z.unknown().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
  options: z.array(z.object({ value: z.unknown(), label: z.string() })).optional(),
})

export const ThemeEditorDataSchema = z.object({
  theme: z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(['live', 'unpublished']),
    key: z.string(),
  }),
  settingsSchema: z.array(
    z.object({
      name: z.string(),
      settings: z.array(ThemeSettingDefinitionSchema),
    })
  ),
  sectionSchemas: z.record(
    z.string(),
    z.object({
      name: z.string(),
      settings: z.array(ThemeSettingDefinitionSchema),
      blocks: z.array(
        z.object({
          type: z.string(),
          name: z.string(),
          limit: z.number().optional(),
          settings: z.array(ThemeSettingDefinitionSchema),
        })
      ),
      presets: z.array(
        z.object({
          name: z.string(),
          settings: z.record(z.string(), z.unknown()).optional(),
          blocks: z
            .array(
              z.object({
                type: z.string(),
                settings: z.record(z.string(), z.unknown()).optional(),
              })
            )
            .optional(),
        })
      ),
      maxBlocks: z.number().optional(),
      enabledOn: z.array(z.string()).nullable().optional(),
    })
  ),
  settings: z.object({
    published: ThemeSettingsDataSchema,
    draft: ThemeSettingsDataSchema.nullable(),
  }),
  templates: z.array(
    z.object({
      name: z.string(),
      published: ThemeTemplateDataSchema,
      draft: ThemeTemplateDataSchema.nullable(),
    })
  ),
  previewPaths: z.object({
    index: z.string(),
    product: z.string(),
    collection: z.string(),
    page: z.string(),
  }),
})

export type ThemeEditorData = z.infer<typeof ThemeEditorDataSchema>
export type ThemeSettingsData = z.infer<typeof ThemeSettingsDataSchema>
export type ThemeTemplateData = z.infer<typeof ThemeTemplateDataSchema>
export type ThemeSectionData = z.infer<typeof ThemeSectionDataSchema>
export type ThemeSettingDefinition = z.infer<typeof ThemeSettingDefinitionSchema>
