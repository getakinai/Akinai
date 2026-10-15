import { type ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from '~/lib/styles'

type FormButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  loading?: boolean
  loadingText?: string
}

export default function FormButton({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  loadingText = 'One moment…',
  type = 'submit',
  className,
  disabled,
  children,
  ...props
}: FormButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  )
}
