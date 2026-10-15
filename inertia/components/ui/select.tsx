import { type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn, compactSelect, field } from '~/lib/styles'

export type SelectOption = { value: string; label: string }

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  options: SelectOption[]
  size?: 'sm' | 'md'
}

export default function Select({ options, size = 'sm', className, ...props }: SelectProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <select
        className={cn(
          size === 'sm' ? compactSelect : cn(field.input, 'w-full appearance-none pr-8')
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-subtle"
      />
    </span>
  )
}
