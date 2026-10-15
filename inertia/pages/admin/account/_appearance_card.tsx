import { FormSwitch } from '~/components/form'
import { useTheme } from '~/hooks/use_theme'
import { card } from '~/lib/styles'

export default function AppearanceCard() {
  const { isDark, toggle } = useTheme()

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Preferences</span>
          <h2 className={card.title}>Appearance</h2>
          <p className="mt-0.5 text-[13px] text-pretty text-muted">Saved on this browser.</p>
        </div>
      </header>

      <div className="max-w-[480px]">
        <FormSwitch name="darkMode" label="Dark mode" checked={isDark} onChange={toggle} />
      </div>
    </section>
  )
}
