import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Eye, GripVertical, Monitor, Save, Smartphone, Tablet } from 'lucide-react'
import { FormButton, FormSelect } from '~/components/form'
import { Skeleton } from '~/components/ui'
import { useDebouncedValue } from '~/hooks/use_debounced_value'
import { HttpError } from '~/lib/http'
import { buttonClasses, cn } from '~/lib/styles'
import {
  useCommitThemeDraft,
  useDiscardThemeDraft,
  useSaveThemeSettingsDraft,
  useSaveThemeTemplateDraft,
  useThemeEditorData,
} from './_editor_hooks'
import type {
  ThemeEditorData,
  ThemeSectionData,
  ThemeSettingsData,
  ThemeTemplateData,
} from './_editor_types'
import { ThemeSettingField } from './_theme_setting_field'

type Props = { themeId: string; themeName: string; themeRole: 'live' | 'unpublished' }

type Selection =
  | { scope: 'theme' }
  | { scope: 'settings-section'; id: string }
  | { scope: 'template-section'; id: string }

function effectiveSettings(data: ThemeEditorData): ThemeSettingsData {
  return data.settings.draft ?? data.settings.published
}

function effectiveTemplate(data: ThemeEditorData, name: string): ThemeTemplateData {
  const row = data.templates.find((template) => template.name === name)
  if (!row) return { sections: {}, order: [] }
  return row.draft ?? row.published
}

function templateType(name: string): keyof ThemeEditorData['previewPaths'] {
  return name.split('.')[0] as keyof ThemeEditorData['previewPaths']
}

function SortableSectionRow({
  id,
  label,
  selected,
  onSelect,
  onToggleHidden,
  hidden,
}: {
  id: string
  label: string
  selected: boolean
  onSelect: () => void
  onToggleHidden: () => void
  hidden: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-2 py-2 text-[13px]',
        selected ? 'border-accent bg-accent/5' : 'border-line bg-paper'
      )}
    >
      <button type="button" className="cursor-grab text-muted" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left font-medium"
        onClick={onSelect}
      >
        {label}
        {hidden && <span className="ml-2 text-muted">(hidden)</span>}
      </button>
      <button type="button" className="text-[12px] text-muted underline" onClick={onToggleHidden}>
        {hidden ? 'Show' : 'Hide'}
      </button>
    </li>
  )
}

export default function ThemeEditor({ themeId, themeName, themeRole }: Props) {
  const query = useThemeEditorData(themeId)
  const saveSettings = useSaveThemeSettingsDraft(themeId)
  const saveTemplate = useSaveThemeTemplateDraft(themeId)
  const commit = useCommitThemeDraft(themeId)
  const discard = useDiscardThemeDraft(themeId)

  const [templateName, setTemplateName] = useState('index')
  const [selection, setSelection] = useState<Selection>({ scope: 'theme' })
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [settingsDraft, setSettingsDraft] = useState<ThemeSettingsData | null>(null)
  const [templateDraft, setTemplateDraft] = useState<ThemeTemplateData | null>(null)
  const [iframeKey, setIframeKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const data = query.data
  const settings = settingsDraft ?? (data ? effectiveSettings(data) : null)
  const template = templateDraft ?? (data ? effectiveTemplate(data, templateName) : null)

  const debouncedSettings = useDebouncedValue(settings, 500)
  const debouncedTemplate = useDebouncedValue(template, 500)

  const refreshPreview = useCallback(() => {
    setIframeKey((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!settingsDraft || !debouncedSettings) return
    saveSettings.mutate(debouncedSettings, {
      onSuccess: () => refreshPreview(),
      onError: (error) =>
        toast.error(error instanceof HttpError ? error.message : 'Could not save theme settings'),
    })
  }, [debouncedSettings, settingsDraft])

  useEffect(() => {
    if (!templateDraft || !debouncedTemplate) return
    saveTemplate.mutate(
      { name: templateName, data: debouncedTemplate },
      {
        onSuccess: () => refreshPreview(),
        onError: (error) =>
          toast.error(error instanceof HttpError ? error.message : 'Could not save template'),
      }
    )
  }, [debouncedTemplate, templateDraft, templateName])

  const previewPath = data?.previewPaths[templateType(templateName)] ?? '/'

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const payload = event.data
      if (!payload || payload.source !== 'akinai-theme' || payload.type !== 'section-select') return
      setSelection({ scope: 'template-section', id: String(payload.sectionId) })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const staticSectionIds = useMemo(
    () => (settings ? Object.keys(settings.sections) : []),
    [settings]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function onDragEnd(event: DragEndEvent) {
    if (!template || event.over === null) return
    const oldIndex = template.order.indexOf(String(event.active.id))
    const newIndex = template.order.indexOf(String(event.over.id))
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
    setTemplateDraft({ ...template, order: arrayMove(template.order, oldIndex, newIndex) })
  }

  function updateThemeSetting(id: string, value: unknown) {
    if (!settings) return
    setSettingsDraft({ ...settings, current: { ...settings.current, [id]: value } })
  }

  function updateSectionSettings(
    scope: Selection['scope'],
    sectionId: string,
    patch: Record<string, unknown>
  ) {
    if (!settings || !template) return
    if (scope === 'settings-section') {
      const section = settings.sections[sectionId] as ThemeSectionData | undefined
      if (!section) return
      setSettingsDraft({
        ...settings,
        sections: {
          ...settings.sections,
          [sectionId]: { ...section, settings: { ...(section.settings ?? {}), ...patch } },
        },
      })
      return
    }
    const section = template.sections[sectionId] as ThemeSectionData | undefined
    if (!section) return
    setTemplateDraft({
      ...template,
      sections: {
        ...template.sections,
        [sectionId]: { ...section, settings: { ...(section.settings ?? {}), ...patch } },
      },
    })
  }

  function toggleTemplateSectionHidden(sectionId: string) {
    if (!template) return
    const section = template.sections[sectionId]
    if (!section) return
    setTemplateDraft({
      ...template,
      sections: {
        ...template.sections,
        [sectionId]: { ...section, disabled: !section.disabled },
      },
    })
  }

  const selectedDefinitions = useMemo(() => {
    if (!data || !settings || !template) return []
    if (selection.scope === 'theme') {
      return data.settingsSchema.flatMap((group) => group.settings)
    }
    if (selection.scope === 'settings-section') {
      const section = settings.sections[selection.id]
      if (!section) return []
      return data.sectionSchemas[section.type]?.settings ?? []
    }
    const section = template.sections[selection.id]
    if (!section) return []
    return data.sectionSchemas[section.type]?.settings ?? []
  }, [data, selection, settings, template])

  const selectedValues = useMemo(() => {
    if (!settings || !template) return {}
    if (selection.scope === 'theme') return settings.current
    if (selection.scope === 'settings-section') {
      return settings.sections[selection.id]?.settings ?? {}
    }
    return template.sections[selection.id]?.settings ?? {}
  }, [selection, settings, template])

  function onSave() {
    commit.mutate(undefined, {
      onSuccess: () => {
        toast.success('Theme saved')
        refreshPreview()
      },
      onError: (error) =>
        toast.error(error instanceof HttpError ? error.message : 'Could not save theme'),
    })
  }

  function onDiscard() {
    discard.mutate(undefined, {
      onSuccess: () => {
        toast.success('Draft discarded')
        setSettingsDraft(null)
        setTemplateDraft(null)
        refreshPreview()
      },
      onError: (error) =>
        toast.error(error instanceof HttpError ? error.message : 'Could not discard draft'),
    })
  }

  const deviceWidth = device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : '100%'

  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-paper px-4 py-3">
        <a
          href={`/admin/themes/${encodeURIComponent(themeId)}/editor/exit`}
          className={buttonClasses({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft size={16} /> Exit
        </a>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{themeName}</p>
          <p className="text-[12px] text-muted">
            {themeRole === 'live' ? 'Live theme' : 'Unpublished'} · changes are drafts until you
            save
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line p-1">
          {(
            [
              ['desktop', Monitor],
              ['tablet', Tablet],
              ['mobile', Smartphone],
            ] as const
          ).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              className={cn(
                'rounded-md p-2',
                device === key ? 'bg-accent text-accent-foreground' : 'text-muted'
              )}
              onClick={() => setDevice(key)}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        {data && (
          <FormSelect
            name="template"
            label="Template"
            hideLabel
            value={templateName}
            onChange={(event) => {
              setTemplateName(event.target.value)
              setSelection({ scope: 'theme' })
              setTemplateDraft(null)
            }}
            options={data.templates.map((row) => ({ value: row.name, label: row.name }))}
          />
        )}
        <FormButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={onDiscard}
          loading={discard.isPending}
        >
          Discard
        </FormButton>
        <FormButton type="button" size="sm" onClick={onSave} loading={commit.isPending}>
          <Save size={14} /> Save
        </FormButton>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_1fr_320px]">
        <aside className="overflow-y-auto border-r border-line bg-paper p-4">
          {query.isLoading && <Skeleton className="h-40" />}
          {data && settings && template && (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left text-[13px] font-medium',
                    selection.scope === 'theme' ? 'border-accent bg-accent/5' : 'border-line'
                  )}
                  onClick={() => setSelection({ scope: 'theme' })}
                >
                  Theme settings
                </button>
              </div>
              {staticSectionIds.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
                    Header & footer
                  </p>
                  <ul className="space-y-2">
                    {staticSectionIds.map((id) => {
                      const section = settings.sections[id]
                      const schema = data.sectionSchemas[section.type]
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            className={cn(
                              'w-full rounded-lg border px-3 py-2 text-left text-[13px]',
                              selection.scope === 'settings-section' && selection.id === id
                                ? 'border-accent bg-accent/5'
                                : 'border-line'
                            )}
                            onClick={() => setSelection({ scope: 'settings-section', id })}
                          >
                            {schema?.name ?? section.type}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  {templateName} sections
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext items={template.order} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2">
                      {template.order.map((id) => {
                        const section = template.sections[id]
                        if (!section) return null
                        const schema = data.sectionSchemas[section.type]
                        return (
                          <SortableSectionRow
                            key={id}
                            id={id}
                            label={schema?.name ?? section.type}
                            selected={selection.scope === 'template-section' && selection.id === id}
                            hidden={Boolean(section.disabled)}
                            onSelect={() => setSelection({ scope: 'template-section', id })}
                            onToggleHidden={() => toggleTemplateSectionHidden(id)}
                          />
                        )
                      })}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </aside>

        <main className="flex min-h-0 flex-col items-center overflow-auto bg-canvas p-4">
          <div className="mb-2 flex items-center gap-2 text-[12px] text-muted">
            <Eye size={14} /> Preview
          </div>
          <div
            className="h-full min-h-[480px] w-full rounded-xl border border-line bg-paper shadow-sm transition-[max-width]"
            style={{ maxWidth: deviceWidth }}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              title="Theme preview"
              src={previewPath}
              className="size-full rounded-xl"
            />
          </div>
        </main>

        <aside className="overflow-y-auto border-l border-line bg-paper p-4">
          <p className="mb-4 text-[13px] font-semibold">Settings</p>
          {selectedDefinitions.length === 0 && (
            <p className="text-[13px] text-muted">
              Select theme settings or a section to edit its fields.
            </p>
          )}
          <div className="space-y-4">
            {selectedDefinitions.map((setting) =>
              setting.id ? (
                <ThemeSettingField
                  key={setting.id}
                  setting={setting}
                  value={selectedValues[setting.id] ?? setting.default ?? ''}
                  onChange={(value) => {
                    if (selection.scope === 'theme') {
                      updateThemeSetting(setting.id!, value)
                      return
                    }
                    if (selection.scope === 'settings-section') {
                      updateSectionSettings('settings-section', selection.id, {
                        [setting.id!]: value,
                      })
                      return
                    }
                    updateSectionSettings('template-section', selection.id, {
                      [setting.id!]: value,
                    })
                  }}
                />
              ) : (
                <ThemeSettingField
                  key={`${setting.type}-${setting.label}`}
                  setting={setting}
                  value={null}
                  onChange={() => {}}
                />
              )
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
