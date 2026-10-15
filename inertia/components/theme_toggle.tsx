import { Moon, Sun } from 'lucide-react'
import { useTheme } from '~/hooks/use_theme'
import { cn, iconButton } from '~/lib/styles'

const icon =
  'col-start-1 row-start-1 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]'
const iconOn = 'scale-100 opacity-100 blur-[0px]'
const iconOff = 'scale-25 opacity-0 blur-[4px]'

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      className={iconButton}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Sun size={16} className={cn(icon, isDark ? iconOn : iconOff)} />
      <Moon size={16} className={cn(icon, isDark ? iconOff : iconOn)} />
    </button>
  )
}
