import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import {
  ArrowLeft,
  Code2,
  Copy,
  GripVertical,
  LayoutTemplate,
  Monitor,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Save,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react'
import { FormButton } from '~/components/form'
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
import { ThemeEditorMarkupPanel } from './_editor_markup_panel'
import { ThemeSettingField } from './_theme_setting_field'
import {
  canAddBlockType,
  duplicateSection,
  newBlockId,
  newSectionId,
  sectionFromPreset,
  sectionThemeSourcePath,
  sectionTypesForTemplate,
  staticSectionIds as staticSectionIdsFromSettings,
  templateDisplayName,
  templateRefreshSectionIds,
} from './_editor_utils'

type Props = { themeId: string; themeName: string; themeRole: 'live' | 'unpublished' }

type BlockData = {
  type: string
  settings?: Record<string, unknown>
  disabled?: boolean
}

type Selection =
  | { scope: 'theme' }
  | { scope: 'settings-section'; id: string }
  | { scope: 'template-section'; id: string; blockId?: string }
  | { scope: 'template-block'; sectionId: string; blockId: string }

const THEME_APP_BLOCK = '@app'

function settingEditorKey(selection: Selection, settingId: string): string {
  switch (selection.scope) {
    case 'theme':
      return `theme:${settingId}`
    case 'settings-section':
      return `settings-section:${selection.id}:${settingId}`
    case 'template-section':
      return `template-section:${selection.id}:${settingId}`
    case 'template-block':
      return `template-block:${selection.sectionId}:${selection.blockId}:${settingId}`
  }
}

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

const THEME_EDITOR_PANELS_KEY = 'akinai-theme-editor-panels'
const THEME_EDITOR_MODE_KEY = 'akinai-theme-editor-mode'
const THEME_EDITOR_CENTER_MODE_KEY = 'akinai-theme-editor-center-mode'

type EditorMode = 'visual' | 'code'

function readEditorMode(): EditorMode {
  if (typeof window === 'undefined') return 'visual'
  try {
    const raw = sessionStorage.getItem(THEME_EDITOR_MODE_KEY)
    if (raw === 'visual' || raw === 'code') return raw
    const legacy = sessionStorage.getItem(THEME_EDITOR_CENTER_MODE_KEY)
    if (legacy === 'preview') return 'visual'
    if (legacy === 'markup') return 'code'
    return 'visual'
  } catch {
    return 'visual'
  }
}

function readPanelPrefs(): { left: boolean; right: boolean } {
  if (typeof window === 'undefined') return { left: true, right: true }
  try {
    const raw = sessionStorage.getItem(THEME_EDITOR_PANELS_KEY)
    if (!raw) return { left: true, right: true }
    const parsed = JSON.parse(raw) as { left?: boolean; right?: boolean }
    return {
      left: parsed.left !== false,
      right: parsed.right !== false,
    }
  } catch {
    return { left: true, right: true }
  }
}

function EditorSidebar({
  side,
  title,
  open,
  onOpenChange,
  children,
}: {
  side: 'left' | 'right'
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const OpenIcon = side === 'left' ? PanelLeftOpen : PanelRightOpen
  const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose
  const borderSide = side === 'left' ? 'border-r' : 'border-l'

  if (!open) {
    return (
      <aside
        className={cn(
          'hidden min-h-0 shrink-0 flex-col items-center border-line bg-paper pt-2 lg:flex',
          borderSide,
          'w-10'
        )}
      >
        <button
          type="button"
          className={buttonClasses({ variant: 'ghost', size: 'sm' })}
          aria-label={`Show ${title}`}
          onClick={() => onOpenChange(true)}
        >
          <OpenIcon size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        'flex min-h-0 min-w-0 flex-col border-line bg-paper',
        borderSide,
        'max-lg:max-h-[min(40vh,420px)] max-lg:w-full',
        side === 'left' ? 'max-lg:border-b lg:w-[280px]' : 'max-lg:border-t lg:w-[380px]'
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </span>
        <button
          type="button"
          className={buttonClasses({ variant: 'ghost', size: 'sm' })}
          aria-label={`Hide ${title}`}
          onClick={() => onOpenChange(false)}
        >
          <CloseIcon size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  )
}

function SortableBlockRow({
  id,
  label,
  selected,
  onSelect,
  onRemove,
}: {
  id: string
  label: string
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[12px]',
        selected ? 'border-accent bg-accent/5' : 'border-line'
      )}
    >
      <button type="button" className="cursor-grab text-muted" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </button>
      <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={onSelect}>
        {label}
      </button>
      <button type="button" className="text-muted" aria-label="Remove block" onClick={onRemove}>
        <Trash2 size={14} />
      </button>
    </li>
  )
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

  const [templateName] = useState('index')
  const [selection, setSelection] = useState<Selection>({ scope: 'theme' })
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [settingsDraft, setSettingsDraft] = useState<ThemeSettingsData | null>(null)
  const [templateDraft, setTemplateDraft] = useState<ThemeTemplateData | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>(() => readEditorMode())
  const [htmlRevision, setHtmlRevision] = useState(0)
  const [iframeKey, setIframeKey] = useState(0)
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => readPanelPrefs().left)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() => readPanelPrefs().right)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const themeSettingsSnapshot = useRef<string | null>(null)

  const data = query.data
  const settings = settingsDraft ?? (data ? effectiveSettings(data) : null)
  const template = templateDraft ?? (data ? effectiveTemplate(data, templateName) : null)

  const debouncedSettings = useDebouncedValue(settings, 500)
  const debouncedTemplate = useDebouncedValue(template, 500)
  const previewPath = data?.previewPaths[templateType(templateName)] ?? '/'

  useEffect(() => {
    sessionStorage.setItem(
      THEME_EDITOR_PANELS_KEY,
      JSON.stringify({ left: leftSidebarOpen, right: rightSidebarOpen })
    )
  }, [leftSidebarOpen, rightSidebarOpen])

  useEffect(() => {
    sessionStorage.setItem(THEME_EDITOR_MODE_KEY, editorMode)
  }, [editorMode])

  const notifyMarkupRefresh = useCallback(() => {
    setHtmlRevision((value) => value + 1)
  }, [])

  const applyTemplateJson = useCallback((templateData: ThemeTemplateData) => {
    setTemplateDraft(templateData)
  }, [])

  const reloadIframe = useCallback(() => {
    notifyMarkupRefresh()
    setIframeKey((value) => value + 1)
  }, [notifyMarkupRefresh])

  /** Reorder template section nodes inside the preview iframe without a full reload. */
  const applySectionOrderToPreview = useCallback(
    (order: string[]) => {
      if (editorMode !== 'visual') return
      const doc = iframeRef.current?.contentDocument
      const main = doc?.getElementById('main')
      if (!doc || !main) return
      const nodes = order
        .map((id) => doc.getElementById(`akinai-section-${id}`))
        .filter((node): node is HTMLElement => node instanceof HTMLElement)
      if (nodes.length === 0) return
      for (const node of nodes) {
        main.appendChild(node)
      }
    },
    [editorMode]
  )

  const refreshSections = useCallback(
    async (sectionIds: string[]) => {
      if (editorMode !== 'visual') return

      const iframe = iframeRef.current
      if (!iframe?.contentDocument || sectionIds.length === 0) {
        setIframeKey((value) => value + 1)
        return
      }
      const base = previewPath
      const joiner = base.includes('?') ? '&' : '?'
      for (const id of sectionIds) {
        try {
          const response = await fetch(`${base}${joiner}section_id=${encodeURIComponent(id)}`, {
            credentials: 'include',
          })
          if (!response.ok) throw new Error('section refresh failed')
          const html = await response.text()
          const node = iframe.contentDocument.getElementById(`akinai-section-${id}`)
          if (node) node.outerHTML = html
        } catch {
          setIframeKey((value) => value + 1)
          return
        }
      }
    },
    [editorMode, previewPath]
  )

  useEffect(() => {
    if (!settingsDraft || !debouncedSettings) return
    const snapshot = JSON.stringify(debouncedSettings.current)
    const themeGlobalsChanged =
      themeSettingsSnapshot.current !== null && themeSettingsSnapshot.current !== snapshot
    themeSettingsSnapshot.current = snapshot
    saveSettings.mutate(debouncedSettings, {
      onSuccess: () => {
        if (editorMode === 'visual') {
          if (themeGlobalsChanged) reloadIframe()
          else refreshSections(staticSectionIdsFromSettings(debouncedSettings))
        } else {
          notifyMarkupRefresh()
        }
      },
      onError: (error) =>
        toast.error(error instanceof HttpError ? error.message : 'Could not save theme settings'),
    })
    // Debounced autosave: only re-run when draft payload changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saveSettings, reloadIframe, refreshSections, notifyMarkupRefresh, editorMode
  }, [debouncedSettings, settingsDraft])

  useEffect(() => {
    if (!templateDraft || !debouncedTemplate) return
    saveTemplate.mutate(
      { name: templateName, data: debouncedTemplate },
      {
        onSuccess: () => {
          if (editorMode === 'visual') {
            refreshSections(templateRefreshSectionIds(debouncedTemplate))
          } else {
            notifyMarkupRefresh()
          }
        },
        onError: (error) =>
          toast.error(error instanceof HttpError ? error.message : 'Could not save template'),
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saveTemplate, refreshSections, notifyMarkupRefresh, editorMode
  }, [debouncedTemplate, templateDraft, templateName])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const payload = event.data
      if (!payload || payload.source !== 'akinai-theme') return
      if (editorMode !== 'visual') return
      if (payload.type === 'block-select' && payload.sectionId && payload.blockId) {
        setSelection({
          scope: 'template-block',
          sectionId: String(payload.sectionId),
          blockId: String(payload.blockId),
        })
        return
      }
      if (payload.type === 'section-select' && payload.sectionId) {
        setSelection({ scope: 'template-section', id: String(payload.sectionId) })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [editorMode])

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
    const order = arrayMove(template.order, oldIndex, newIndex)
    setTemplateDraft({ ...template, order })
    applySectionOrderToPreview(order)
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

  function blocksForSection(section: ThemeSectionData): { id: string; block: BlockData }[] {
    const order = section.blockOrder ?? Object.keys(section.blocks ?? {})
    return order
      .map((id) => {
        const raw = section.blocks?.[id]
        if (!raw || typeof raw !== 'object' || !('type' in raw)) return null
        return { id, block: raw as BlockData }
      })
      .filter((entry): entry is { id: string; block: BlockData } => entry !== null)
  }

  function addTemplateSection(type: string) {
    if (!data || !template) return
    const schema = data.sectionSchemas[type]
    if (!schema) return
    const id = newSectionId()
    setTemplateDraft({
      ...template,
      order: [...template.order, id],
      sections: { ...template.sections, [id]: sectionFromPreset(type, schema) },
    })
    setSelection({ scope: 'template-section', id })
    setAddSectionOpen(false)
  }

  function removeTemplateSection(sectionId: string) {
    if (!template) return
    const sections = { ...template.sections }
    delete sections[sectionId]
    setTemplateDraft({
      sections,
      order: template.order.filter((id) => id !== sectionId),
    })
    setSelection({ scope: 'theme' })
  }

  function duplicateTemplateSection(sectionId: string) {
    if (!template) return
    const section = template.sections[sectionId] as ThemeSectionData | undefined
    if (!section) return
    const id = newSectionId()
    const index = template.order.indexOf(sectionId)
    const order = [...template.order]
    order.splice(index + 1, 0, id)
    setTemplateDraft({
      ...template,
      order,
      sections: { ...template.sections, [id]: duplicateSection(section) },
    })
    setSelection({ scope: 'template-section', id })
  }

  function addBlock(sectionId: string, blockType: string, app?: { plugin: string; block: string }) {
    if (!template || !data) return
    const section = template.sections[sectionId] as ThemeSectionData | undefined
    const schema = section ? data.sectionSchemas[section.type] : undefined
    if (!section || !schema) return
    if (!canAddBlockType(section, schema, blockType)) return
    const id = newBlockId()
    const blockDef = schema.blocks.find((block) => block.type === blockType)
    const blockSettings =
      blockType === THEME_APP_BLOCK && app
        ? { plugin: app.plugin, block: app.block }
        : Object.fromEntries(
            (blockDef?.settings ?? [])
              .filter((setting) => setting.id && setting.default !== undefined)
              .map((setting) => [setting.id!, setting.default])
          )
    const blocks = { ...(section.blocks ?? {}), [id]: { type: blockType, settings: blockSettings } }
    const blockOrder = [...(section.blockOrder ?? Object.keys(section.blocks ?? {})), id]
    setTemplateDraft({
      ...template,
      sections: {
        ...template.sections,
        [sectionId]: { ...section, blocks, blockOrder },
      },
    })
    setSelection({ scope: 'template-block', sectionId, blockId: id })
  }

  function removeBlock(sectionId: string, blockId: string) {
    if (!template) return
    const section = template.sections[sectionId] as ThemeSectionData | undefined
    if (!section?.blocks) return
    const blocks = { ...section.blocks }
    delete blocks[blockId]
    setTemplateDraft({
      ...template,
      sections: {
        ...template.sections,
        [sectionId]: {
          ...section,
          blocks,
          blockOrder: (section.blockOrder ?? Object.keys(section.blocks)).filter(
            (id) => id !== blockId
          ),
        },
      },
    })
    setSelection({ scope: 'template-section', id: sectionId })
  }

  function updateBlockSettings(sectionId: string, blockId: string, patch: Record<string, unknown>) {
    if (!template) return
    const section = template.sections[sectionId] as ThemeSectionData | undefined
    const block = section?.blocks?.[blockId] as BlockData | undefined
    if (!section || !block) return
    setTemplateDraft({
      ...template,
      sections: {
        ...template.sections,
        [sectionId]: {
          ...section,
          blocks: {
            ...section.blocks,
            [blockId]: { ...block, settings: { ...(block.settings ?? {}), ...patch } },
          },
        },
      },
    })
  }

  function onBlockDragEnd(sectionId: string, event: DragEndEvent) {
    if (!template || event.over === null) return
    const section = template.sections[sectionId] as ThemeSectionData | undefined
    if (!section) return
    const order = section.blockOrder ?? Object.keys(section.blocks ?? {})
    const oldIndex = order.indexOf(String(event.active.id))
    const newIndex = order.indexOf(String(event.over.id))
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
    setTemplateDraft({
      ...template,
      sections: {
        ...template.sections,
        [sectionId]: { ...section, blockOrder: arrayMove(order, oldIndex, newIndex) },
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
    if (selection.scope === 'template-block') {
      const section = template.sections[selection.sectionId]
      if (!section) return []
      const block = section.blocks?.[selection.blockId] as BlockData | undefined
      if (!block) return []
      if (block.type === THEME_APP_BLOCK) return []
      return (
        data.sectionSchemas[section.type]?.blocks.find((entry) => entry.type === block.type)
          ?.settings ?? []
      )
    }
    if (selection.scope === 'template-section') {
      const section = template.sections[selection.id]
      if (!section) return []
      return data.sectionSchemas[section.type]?.settings ?? []
    }
    return []
  }, [data, selection, settings, template])

  const selectedValues = useMemo(() => {
    if (!settings || !template) return {}
    if (selection.scope === 'theme') return settings.current
    if (selection.scope === 'settings-section') {
      return settings.sections[selection.id]?.settings ?? {}
    }
    if (selection.scope === 'template-block') {
      const section = template.sections[selection.sectionId]
      const block = section?.blocks?.[selection.blockId] as BlockData | undefined
      return block?.settings ?? {}
    }
    return template.sections[selection.id]?.settings ?? {}
  }, [selection, settings, template])

  const sectionSourcePath = useMemo(() => {
    if (!settings || !template) return null
    if (selection.scope === 'settings-section') {
      const type = settings.sections[selection.id]?.type
      return type ? sectionThemeSourcePath(type) : null
    }
    if (selection.scope === 'template-section') {
      const type = template.sections[selection.id]?.type
      return type ? sectionThemeSourcePath(type) : null
    }
    if (selection.scope === 'template-block') {
      const type = template.sections[selection.sectionId]?.type
      return type ? sectionThemeSourcePath(type) : null
    }
    return null
  }, [selection, settings, template])

  const selectedSectionForBlocks = useMemo(() => {
    if (!template || selection.scope === 'theme' || selection.scope === 'settings-section') {
      return null
    }
    const sectionId = selection.scope === 'template-block' ? selection.sectionId : selection.id
    return { id: sectionId, section: template.sections[sectionId] as ThemeSectionData | undefined }
  }, [selection, template])

  function onSave() {
    commit.mutate(undefined, {
      onSuccess: () => {
        toast.success('Theme saved')
        if (editorMode === 'visual') reloadIframe()
        else notifyMarkupRefresh()
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
        if (editorMode === 'visual') reloadIframe()
        else notifyMarkupRefresh()
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
        <div
          className="flex items-center gap-0.5 rounded-lg border border-line p-0.5"
          role="group"
          aria-label="Editor mode"
        >
          {(
            [
              ['visual', 'Visual', LayoutTemplate],
              ['code', 'Code', Code2],
            ] as const
          ).map(([mode, label, Icon]) => (
            <button
              key={mode}
              type="button"
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium',
                editorMode === mode ? 'bg-btn text-btn-fg' : 'text-muted hover:text-ink'
              )}
              aria-pressed={editorMode === mode}
              onClick={() => setEditorMode(mode)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        {editorMode === 'visual' ? (
          <div className="flex items-center gap-1 rounded-lg border border-line p-1">
            <button
              type="button"
              className={cn(
                'rounded-md p-2 lg:hidden',
                leftSidebarOpen ? 'bg-btn text-btn-fg' : 'text-muted hover:text-ink'
              )}
              aria-label={leftSidebarOpen ? 'Hide sections panel' : 'Show sections panel'}
              aria-pressed={leftSidebarOpen}
              onClick={() => setLeftSidebarOpen((open) => !open)}
            >
              <PanelLeft size={16} />
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md p-2 lg:hidden',
                rightSidebarOpen ? 'bg-btn text-btn-fg' : 'text-muted hover:text-ink'
              )}
              aria-label={rightSidebarOpen ? 'Hide settings panel' : 'Show settings panel'}
              aria-pressed={rightSidebarOpen}
              onClick={() => setRightSidebarOpen((open) => !open)}
            >
              <PanelRight size={16} />
            </button>
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
                  device === key ? 'bg-btn text-btn-fg' : 'text-muted hover:text-ink'
                )}
                aria-label={`View by ${key}`}
                aria-pressed={device === key}
                onClick={() => setDevice(key)}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        ) : null}
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

      <div
        className={cn(
          'grid min-h-0 flex-1',
          editorMode === 'visual'
            ? 'max-lg:grid-cols-1 max-lg:grid-rows-[auto_1fr_auto] lg:grid-cols-[auto_minmax(0,1fr)_auto]'
            : 'grid-cols-1'
        )}
      >
        {editorMode === 'visual' ? (
          <EditorSidebar
            side="left"
            title="Sections"
            open={leftSidebarOpen}
            onOpenChange={setLeftSidebarOpen}
          >
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
                    {templateDisplayName(templateName)} sections
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
                              selected={
                                (selection.scope === 'template-section' && selection.id === id) ||
                                (selection.scope === 'template-block' && selection.sectionId === id)
                              }
                              hidden={Boolean(section.disabled)}
                              onSelect={() => setSelection({ scope: 'template-section', id })}
                              onToggleHidden={() => toggleTemplateSectionHidden(id)}
                            />
                          )
                        })}
                      </ul>
                    </SortableContext>
                  </DndContext>
                  <div className="mt-3 space-y-2">
                    {addSectionOpen ? (
                      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
                        {sectionTypesForTemplate(data, templateName).map((entry) => (
                          <li key={entry.type}>
                            <button
                              type="button"
                              className="w-full rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-canvas"
                              onClick={() => addTemplateSection(entry.type)}
                            >
                              {entry.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <FormButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setAddSectionOpen((open) => !open)}
                    >
                      <Plus size={14} /> Add section
                    </FormButton>
                    {selection.scope === 'template-section' && (
                      <div className="flex gap-2">
                        <FormButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => duplicateTemplateSection(selection.id)}
                        >
                          <Copy size={14} /> Duplicate
                        </FormButton>
                        <FormButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => removeTemplateSection(selection.id)}
                        >
                          <Trash2 size={14} /> Remove
                        </FormButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </EditorSidebar>
        ) : null}

        <main
          className={cn(
            'flex min-h-0 flex-col overflow-auto bg-canvas max-lg:row-start-2',
            editorMode === 'visual' ? 'items-center p-4' : 'min-h-0 flex-1 p-3'
          )}
        >
          {editorMode === 'code' ? (
            template && settings ? (
              <ThemeEditorMarkupPanel
                themeId={themeId}
                previewPath={previewPath}
                htmlRevision={htmlRevision}
                templateName={templateName}
                template={template}
                settings={settings}
                selection={selection}
                sectionSourcePath={sectionSourcePath}
                onRefreshHtml={notifyMarkupRefresh}
                onApplyTemplateJson={applyTemplateJson}
              />
            ) : (
              <Skeleton className="h-[480px] w-full rounded-xl" />
            )
          ) : (
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
          )}
        </main>

        {editorMode === 'visual' ? (
          <EditorSidebar
            side="right"
            title="Settings"
            open={rightSidebarOpen}
            onOpenChange={setRightSidebarOpen}
          >
            {selectedSectionForBlocks?.section &&
              data &&
              (() => {
                const schema = data.sectionSchemas[selectedSectionForBlocks.section!.type]
                const blockEntries = blocksForSection(selectedSectionForBlocks.section!)
                if (!schema?.blocks.length) return null
                return (
                  <div className="mb-6">
                    <p className="mb-2 text-[13px] font-semibold">Blocks</p>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => onBlockDragEnd(selectedSectionForBlocks.id, event)}
                    >
                      <SortableContext
                        items={blockEntries.map((entry) => entry.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul className="mb-3 space-y-1">
                          {blockEntries.map(({ id, block }) => {
                            const blockSchema = schema.blocks.find(
                              (entry) => entry.type === block.type
                            )
                            const label =
                              block.type === THEME_APP_BLOCK
                                ? `${String(block.settings?.plugin ?? 'App')} · ${String(block.settings?.block ?? 'block')}`
                                : (blockSchema?.name ?? block.type)
                            return (
                              <SortableBlockRow
                                key={id}
                                id={id}
                                label={label}
                                selected={
                                  selection.scope === 'template-block' &&
                                  selection.blockId === id &&
                                  selection.sectionId === selectedSectionForBlocks.id
                                }
                                onSelect={() =>
                                  setSelection({
                                    scope: 'template-block',
                                    sectionId: selectedSectionForBlocks.id,
                                    blockId: id,
                                  })
                                }
                                onRemove={() => removeBlock(selectedSectionForBlocks.id, id)}
                              />
                            )
                          })}
                        </ul>
                      </SortableContext>
                    </DndContext>
                    <div className="space-y-1">
                      {schema.blocks
                        .filter((block) => block.type !== THEME_APP_BLOCK)
                        .filter((block) =>
                          canAddBlockType(selectedSectionForBlocks.section!, schema, block.type)
                        )
                        .map((block) => (
                          <button
                            key={block.type}
                            type="button"
                            className="w-full rounded-md border border-line px-2 py-1.5 text-left text-[12px] hover:bg-canvas"
                            onClick={() => addBlock(selectedSectionForBlocks.id, block.type)}
                          >
                            <Plus size={12} className="mr-1 inline" />
                            {block.name}
                          </button>
                        ))}
                      {schema.blocks.some((block) => block.type === THEME_APP_BLOCK) &&
                        (data.installedPlugins ?? []).flatMap((plugin) =>
                          plugin.appBlocks.map((appBlock) => (
                            <button
                              key={`${plugin.key}-${appBlock.type}`}
                              type="button"
                              className="w-full rounded-md border border-line px-2 py-1.5 text-left text-[12px] hover:bg-canvas"
                              onClick={() =>
                                addBlock(selectedSectionForBlocks.id, THEME_APP_BLOCK, {
                                  plugin: plugin.key,
                                  block: appBlock.type,
                                })
                              }
                            >
                              <Plus size={12} className="mr-1 inline" />
                              {plugin.name}: {appBlock.name}
                            </button>
                          ))
                        )}
                    </div>
                  </div>
                )
              })()}
            {selection.scope === 'template-block' &&
              typeof selectedValues.plugin === 'string' &&
              selectedDefinitions.length === 0 && (
                <p className="mb-4 text-[13px] text-muted">
                  This app block is configured in the plugin admin. Uninstalling the plugin hides it
                  on the storefront.
                </p>
              )}
            {selectedDefinitions.length === 0 && selection.scope !== 'template-block' && (
              <p className="text-[13px] text-muted">
                Select theme settings or a section to edit its fields.
              </p>
            )}
            <div className="space-y-4">
              {selectedDefinitions.map((setting) =>
                setting.id ? (
                  <ThemeSettingField
                    key={settingEditorKey(selection, setting.id)}
                    setting={setting}
                    editorKey={settingEditorKey(selection, setting.id)}
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
                      if (selection.scope === 'template-block') {
                        updateBlockSettings(selection.sectionId, selection.blockId, {
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
          </EditorSidebar>
        ) : null}
      </div>
    </div>
  )
}
