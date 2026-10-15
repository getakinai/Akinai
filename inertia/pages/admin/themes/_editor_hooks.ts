import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { http } from '~/lib/http'
import {
  ThemeEditorDataSchema,
  type ThemeSettingsData,
  type ThemeTemplateData,
} from './_editor_types'

export const themeEditorKeys = {
  data: (id: string) => ['admin', 'themes', id, 'editor'] as const,
  source: (id: string, path: string) => ['admin', 'themes', id, 'editor', 'source', path] as const,
}

const ThemeEditorSourceSchema = z.object({
  path: z.string(),
  content: z.string(),
})

export function useSaveThemeEditorSource(themeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      http(`/admin/themes/${encodeURIComponent(themeId)}/editor/source`, {
        method: 'PUT',
        body: { path, content },
        schema: z.unknown(),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: themeEditorKeys.source(themeId, variables.path),
      })
    },
  })
}

export function useThemeEditorSource(themeId: string, path: string | null, enabled: boolean) {
  return useQuery({
    queryKey: themeEditorKeys.source(themeId, path ?? ''),
    enabled: enabled && Boolean(path),
    queryFn: () =>
      http(
        `/admin/themes/${encodeURIComponent(themeId)}/editor/source?path=${encodeURIComponent(path!)}`,
        { schema: z.object({ data: ThemeEditorSourceSchema }) }
      ).then((response) => response.data),
  })
}

export function useThemeEditorData(themeId: string) {
  return useQuery({
    queryKey: themeEditorKeys.data(themeId),
    queryFn: () =>
      http(`/admin/themes/${encodeURIComponent(themeId)}/editor/data`, {
        schema: z.object({ data: ThemeEditorDataSchema }),
      }).then((response) => response.data),
  })
}

function useEditorMutation<TInput>(
  themeId: string,
  mutationFn: (input: TInput) => Promise<unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: themeEditorKeys.data(themeId) }),
  })
}

export function useSaveThemeSettingsDraft(themeId: string) {
  return useEditorMutation(themeId, (body: ThemeSettingsData) =>
    http(`/admin/themes/${encodeURIComponent(themeId)}/editor/settings`, {
      method: 'PUT',
      body,
      schema: z.unknown(),
    })
  )
}

export function useSaveThemeTemplateDraft(themeId: string) {
  return useEditorMutation(themeId, ({ name, data }: { name: string; data: ThemeTemplateData }) =>
    http(
      `/admin/themes/${encodeURIComponent(themeId)}/editor/templates/${encodeURIComponent(name)}`,
      { method: 'PUT', body: data, schema: z.unknown() }
    )
  )
}

export function useCommitThemeDraft(themeId: string) {
  return useEditorMutation(themeId, () =>
    http(`/admin/themes/${encodeURIComponent(themeId)}/editor/save`, {
      method: 'POST',
      schema: z.unknown(),
    })
  )
}

export function useDiscardThemeDraft(themeId: string) {
  return useEditorMutation(themeId, () =>
    http(`/admin/themes/${encodeURIComponent(themeId)}/editor/discard`, {
      method: 'POST',
      schema: z.unknown(),
    })
  )
}
