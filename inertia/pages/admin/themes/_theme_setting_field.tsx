import { useState } from 'react'
import {
  FormCheckbox,
  FormInput,
  FormRichtextEditor,
  FormSelect,
  FormTextarea,
} from '~/components/form'
import type { ThemeSettingDefinition } from './_editor_types'
import { MediaPickerDialog } from './_media_picker_dialog'

type Props = {
  setting: ThemeSettingDefinition
  value: unknown
  onChange: (value: unknown) => void
  /** Remount rich text when another section or field is selected. */
  editorKey?: string
}

export function ThemeSettingField({ setting, value, onChange, editorKey }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false)
  const fieldName = setting.id ?? setting.type

  if (setting.type === 'header') {
    return <p className="text-[13px] font-semibold text-ink">{setting.content ?? setting.label}</p>
  }
  if (setting.type === 'paragraph') {
    return <p className="text-[12px] text-muted">{setting.content ?? setting.label}</p>
  }
  if (!setting.id) return null

  switch (setting.type) {
    case 'checkbox':
      return (
        <FormCheckbox
          name={fieldName}
          label={setting.label ?? setting.id}
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
      )
    case 'textarea':
      return (
        <FormTextarea
          name={fieldName}
          label={setting.label ?? setting.id}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case 'richtext':
      return (
        <FormRichtextEditor
          name={fieldName}
          label={setting.label ?? setting.id}
          value={typeof value === 'string' ? value : ''}
          editorKey={editorKey ?? fieldName}
          onChange={(html) => onChange(html)}
          minHeight={200}
          placeholder={setting.label ? `Enter ${setting.label.toLowerCase()}…` : undefined}
        />
      )
    case 'number':
    case 'range':
      return (
        <div className="space-y-2">
          <FormInput
            name={fieldName}
            label={
              setting.unit
                ? `${setting.label ?? setting.id} (${setting.unit})`
                : (setting.label ?? setting.id)
            }
            inputMode="decimal"
            value={typeof value === 'number' ? String(value) : ''}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          {setting.type === 'range' && (
            <input
              type="range"
              className="w-full"
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={
                typeof value === 'number' ? value : Number(setting.default ?? setting.min ?? 0)
              }
              onChange={(event) => onChange(Number(event.target.value))}
            />
          )}
        </div>
      )
    case 'select':
    case 'radio':
      return (
        <FormSelect
          name={fieldName}
          label={setting.label ?? setting.id}
          value={String(value ?? setting.default ?? '')}
          onChange={(event) => {
            const option = setting.options?.find(
              (entry) => String(entry.value) === event.target.value
            )
            onChange(option?.value ?? event.target.value)
          }}
          options={(setting.options ?? []).map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
        />
      )
    case 'color':
      return (
        <div className="flex items-end gap-3">
          <FormInput
            name={fieldName}
            label={setting.label ?? setting.id}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value)}
          />
          <input
            type="color"
            className="mb-2 size-10 shrink-0 cursor-pointer rounded border border-line bg-paper"
            value={typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )
    case 'image_picker': {
      const key = typeof value === 'string' ? value : null
      return (
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-ink">{setting.label ?? setting.id}</p>
          {key && <p className="truncate text-[12px] text-muted">{key}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-[13px] text-accent underline"
              onClick={() => setMediaOpen(true)}
            >
              Choose from media
            </button>
            {key && (
              <button
                type="button"
                className="text-[13px] text-muted underline"
                onClick={() => onChange(null)}
              >
                Remove
              </button>
            )}
          </div>
          <MediaPickerDialog
            open={mediaOpen}
            onClose={() => setMediaOpen(false)}
            onPick={(mediaKey) => onChange(mediaKey)}
          />
        </div>
      )
    }
    default:
      return (
        <FormInput
          name={fieldName}
          label={setting.label ?? setting.id}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )
  }
}
