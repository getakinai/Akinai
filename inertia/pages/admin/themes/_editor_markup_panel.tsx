import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormSelect } from '~/components/form'
import Tabs, { TabPanel } from '~/components/ui/tabs'
import { formatThemeMarkupCode, ThemeEditorMarkupCode } from './_editor_markup_code'
import { ThemeEditorSourceCodeField } from './_editor_source_code_field'
import { ThemeEditorTemplateJsonField } from './_editor_template_json_field'
import { useThemeEditorSource } from './_editor_hooks'
import type { ThemeSettingsData, ThemeTemplateData } from './_editor_types'
import { editorCodePaths } from './_editor_utils'

type Selection =
  | { scope: 'theme' }
  | { scope: 'settings-section'; id: string }
  | { scope: 'template-section'; id: string; blockId?: string }
  | { scope: 'template-block'; sectionId: string; blockId: string }

type MarkupTab = 'code' | 'template' | 'output'

type Props = {
  themeId: string
  previewPath: string
  htmlRevision: number
  templateName: string
  template: ThemeTemplateData
  settings: ThemeSettingsData
  selection: Selection
  sectionSourcePath: string | null
  onRefreshHtml: () => void
  onApplyTemplateJson: (data: ThemeTemplateData) => void
}

function highlightNeedle(selection: Selection): string | null {
  if (selection.scope === 'template-section') {
    return `id="akinai-section-${selection.id}"`
  }
  if (selection.scope === 'settings-section') {
    return `id="akinai-section-${selection.id}"`
  }
  if (selection.scope === 'template-block') {
    return `data-akinai-block-id="${selection.blockId}"`
  }
  return null
}

function defaultCodePath(sectionSourcePath: string | null, codePaths: string[]): string {
  if (sectionSourcePath && codePaths.includes(sectionSourcePath)) return sectionSourcePath
  if (codePaths.includes('layout/theme.edge')) return 'layout/theme.edge'
  return codePaths[0] ?? 'layout/theme.edge'
}

export function ThemeEditorMarkupPanel({
  themeId,
  previewPath,
  htmlRevision,
  templateName,
  template,
  settings,
  selection,
  sectionSourcePath,
  onRefreshHtml,
  onApplyTemplateJson,
}: Props) {
  const [tab, setTab] = useState<MarkupTab>('code')
  const [html, setHtml] = useState<string | null>(null)
  const [htmlLoading, setHtmlLoading] = useState(false)
  const [htmlError, setHtmlError] = useState<string | null>(null)

  const codePaths = useMemo(
    () => editorCodePaths(settings, template, templateName),
    [settings, template, templateName]
  )

  const [activePath, setActivePath] = useState(() =>
    defaultCodePath(sectionSourcePath, editorCodePaths(settings, template, templateName))
  )

  useEffect(() => {
    if (tab !== 'code') return
    const next = defaultCodePath(sectionSourcePath, codePaths)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow section selection in code tab
    setActivePath((current) => (codePaths.includes(current) ? current : next))
  }, [sectionSourcePath, codePaths, tab])

  const sourceQuery = useThemeEditorSource(themeId, activePath, tab === 'code')

  const formattedHtml = useMemo(() => (html ? formatThemeMarkupCode('html', html) : null), [html])

  const loadHtml = useCallback(async () => {
    setHtmlLoading(true)
    setHtmlError(null)
    try {
      const response = await fetch(previewPath, { credentials: 'include' })
      if (!response.ok) throw new Error('Could not load page HTML')
      setHtml(await response.text())
    } catch {
      setHtmlError('Could not load rendered HTML. Save your draft and try again.')
      setHtml(null)
    } finally {
      setHtmlLoading(false)
    }
  }, [previewPath])

  useEffect(() => {
    if (tab !== 'output') return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadHtml updates fetch state
    void loadHtml()
  }, [tab, loadHtml, htmlRevision])

  const scrollToNeedle = highlightNeedle(selection)

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const pathOptions = codePaths.map((path) => ({ value: path, label: path }))

  return (
    <div className="flex h-full min-h-[480px] w-full flex-1 flex-col rounded-xl border border-line-2 bg-card shadow-[0_1px_2px_rgba(10,10,11,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <Tabs
          idPrefix="theme-editor-markup"
          label="Markup"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'code', label: 'Theme code' },
            { id: 'template', label: 'Template JSON' },
            { id: 'output', label: 'View output' },
          ]}
        />
        <div className="flex shrink-0 items-center gap-2">
          {tab === 'output' ? (
            <>
              <FormButton type="button" variant="secondary" size="sm" onClick={onRefreshHtml}>
                <RefreshCw size={14} /> Refresh
              </FormButton>
              {formattedHtml ? (
                <FormButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => copyText(formattedHtml, 'HTML')}
                >
                  <Copy size={14} /> Copy
                </FormButton>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <TabPanel
        idPrefix="theme-editor-markup"
        id="code"
        active={tab === 'code'}
        className="min-h-0 flex-1"
      >
        <div className="h-full space-y-3 overflow-auto p-3">
          <p className="text-[12px] text-muted">
            Edit theme source files. Changes are drafts until you click <strong>Save</strong> in the
            header (included in theme download).
          </p>
          {pathOptions.length > 0 ? (
            <FormSelect
              name="theme-code-path"
              label="File"
              value={activePath}
              onChange={(event) => setActivePath(event.target.value)}
              options={pathOptions}
            />
          ) : null}
          {sectionSourcePath ? (
            <button
              type="button"
              className="text-[12px] text-accent underline"
              onClick={() => setActivePath(sectionSourcePath)}
            >
              Jump to selected section
            </button>
          ) : null}
          <ThemeEditorSourceCodeField
            themeId={themeId}
            path={activePath}
            content={sourceQuery.data?.content ?? ''}
            isLoading={sourceQuery.isPending}
            loadError={sourceQuery.isError ? 'Could not load this file.' : null}
          />
        </div>
      </TabPanel>

      <TabPanel
        idPrefix="theme-editor-markup"
        id="template"
        active={tab === 'template'}
        className="min-h-0 flex-1"
      >
        <div className="h-full overflow-auto p-3">
          <p className="mb-2 text-[12px] text-muted">
            Edits apply to the current template draft. Click <strong>Save</strong> to publish; the
            zip download includes your changes.
          </p>
          <ThemeEditorTemplateJsonField
            template={template}
            templateName={templateName}
            onApply={onApplyTemplateJson}
          />
        </div>
      </TabPanel>

      <TabPanel
        idPrefix="theme-editor-markup"
        id="output"
        active={tab === 'output'}
        className="min-h-0 flex-1"
      >
        <div className="h-full overflow-auto p-3">
          <p className="mb-2 text-[12px] text-muted">
            Read-only HTML from the storefront (with your drafts). Use Refresh after editing code or
            settings.
          </p>
          {htmlLoading ? (
            <p className="text-[13px] text-muted">Loading rendered HTML…</p>
          ) : htmlError ? (
            <p className="text-[13px] text-destructive">{htmlError}</p>
          ) : html ? (
            <ThemeEditorMarkupCode code={html} language="html" scrollToNeedle={scrollToNeedle} />
          ) : null}
        </div>
      </TabPanel>
    </div>
  )
}
