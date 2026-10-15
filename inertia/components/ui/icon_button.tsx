import { type ButtonHTMLAttributes } from 'react'
import { cn, iconButton } from '~/lib/styles'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  label: string
  size?: 'sm' | 'md'
}

export default function IconButton({
  label,
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        iconButton,
        size === 'sm' && 'size-7 border-transparent',
        'disabled:pointer-events-none disabled:opacity-45',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
