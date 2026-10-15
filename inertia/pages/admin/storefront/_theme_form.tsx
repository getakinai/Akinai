import { useState, type FormEvent } from 'react'
import { Check, Monitor, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { FormButton, FormColorInput } from '~/components/form'
import { handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import {
  THEME_COLOR_FIELDS,
  THEME_PRESETS,
  type ThemeColors,
  type ThemePreset,
} from '~/lib/storefront'
import { card, cn } from '~/lib/styles'
import { useUpdateAdminStorefrontTheme } from './_hooks'
import ThemePreview, { type PreviewDevice } from './_theme_preview'
import { AdminStorefrontThemeFormSchema, type AdminStorefrontTheme } from './_types'

const PREVIEW_DEVICES = [
  { key: 'mobile', label: 'Mobile', Icon: Smartphone },
  { key: 'web', label: 'Web', Icon: Monitor },
] as const satisfies { key: PreviewDevice; label: string; Icon: typeof Smartphone }[]

const PRESET_ENTRIES = Object.entries(THEME_PRESETS) as [
  Exclude<ThemePreset, 'custom'>,
  (typeof THEME_PRESETS)[keyof typeof THEME_PRESETS],
][]

function pickColors(source: ThemeColors): ThemeColors {
  return {
    primaryColor: source.primaryColor,
    primaryForegroundColor: source.primaryForegroundColor,
    accentColor: source.accentColor,
    backgroundColor: source.backgroundColor,
    surfaceColor: source.surfaceColor,
    textColor: source.textColor,
  }
}

function sameColors(a: ThemeColors, b: ThemeColors) {
  return THEME_COLOR_FIELDS.every(({ key }) => a[key].toLowerCase() === b[key].toLowerCase())
}

type ThemeFormProps = {
  theme: AdminStorefrontTheme
  disabled: boolean
}

/**
 * Preset picker, color fields and a live preview. Remount with a new `key`
 * to reset the fields.
 */
export default function ThemeForm({ theme, disabled }: ThemeFormProps) {
  const saved = pickColors(theme)
  const [colors, setColors] = useState<ThemeColors>(saved)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [device, setDevice] = useState<PreviewDevice>('mobile')
  const updateTheme = useUpdateAdminStorefrontTheme()

  const activePreset = PRESET_ENTRIES.find(([, preset]) => sameColors(preset, colors))?.[0]
  const isDirty = !sameColors(colors, saved)

  function setColor(key: keyof ThemeColors, value: string) {
    setColors((current) => ({ ...current, [key]: value }))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = AdminStorefrontThemeFormSchema.safeParse(colors)
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateTheme.mutate(parsed.data, {
      onSuccess: () => toast.success('Storefront theme saved'),
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 items-start gap-6',
        device === 'web'
          ? 'min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,440px)] min-[1360px]:grid-cols-[minmax(0,1fr)_minmax(0,560px)]'
          : 'min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)]'
      )}
    >
      <form className="flex min-w-0 flex-col gap-6" onSubmit={onSubmit} noValidate>
        <section className={card.base}>
          <div className={card.head}>
            <div>
              <div className={card.eyebrow}>Presets</div>
              <h2 className={card.title}>Start from a palette</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESET_ENTRIES.map(([key, preset]) => {
              const selected = activePreset === key
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => {
                    setColors(pickColors(preset))
                    setErrors({})
                  }}
                  className={cn(
                    'flex min-w-0 flex-col gap-2.5 rounded-lg border p-3 text-left transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55',
                    selected ? 'border-ink ring-1 ring-ink' : 'border-line-2 hover:border-subtle'
                  )}
                >
                  <span className="flex h-8 overflow-hidden rounded-md border border-line">
                    {[
                      preset.primaryColor,
                      preset.accentColor,
                      preset.backgroundColor,
                      preset.textColor,
                    ].map((color, index) => (
                      <span
                        key={index}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="flex items-center justify-between gap-2 text-[13.5px] font-medium">
                    {preset.label}
                    {selected && <Check size={14} />}
                  </span>
                </button>
              )
            })}
          </div>
          {!activePreset && (
            <p className="mt-3 text-[12.5px] text-muted">Custom colors. Pick a preset to reset.</p>
          )}
        </section>

        <section className={card.base}>
          <div className={card.head}>
            <div>
              <div className={card.eyebrow}>Colors</div>
              <h2 className={card.title}>Fine-tune the palette</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {THEME_COLOR_FIELDS.map(({ key, label, hint }) => (
              <FormColorInput
                key={key}
                name={key}
                label={label}
                hint={hint}
                value={colors[key]}
                disabled={disabled}
                onChange={(value) => setColor(key, value)}
                error={errors[key]}
              />
            ))}
          </div>
          {!disabled && (
            <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-line pt-4">
              <FormButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={!isDirty || updateTheme.isPending}
                onClick={() => {
                  setColors(saved)
                  setErrors({})
                }}
              >
                Discard
              </FormButton>
              <FormButton size="sm" disabled={!isDirty} loading={updateTheme.isPending}>
                Save theme
              </FormButton>
            </div>
          )}
        </section>
      </form>

      <aside className="flex min-w-0 flex-col gap-2 min-[1100px]:sticky min-[1100px]:top-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={card.eyebrow}>Live preview</div>
          <div
            role="group"
            aria-label="Preview device"
            className="inline-flex rounded-lg border border-line-2 bg-paper p-0.5"
          >
            {PREVIEW_DEVICES.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={device === key}
                onClick={() => setDevice(key)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                  device === key ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <ThemePreview
          colors={colors}
          device={device}
          logoUrl={theme.logoUrl}
          brandName={theme.brandName}
        />
      </aside>
    </div>
  )
}
