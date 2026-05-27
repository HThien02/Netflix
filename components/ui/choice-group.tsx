'use client'

import { cn } from '@/lib/utils'

export type ChoiceOption<T extends string | number> = {
  value: T
  label: string
  disabled?: boolean
}

type ChoiceGroupProps<T extends string | number> = {
  label?: string
  hint?: string
  value: T
  onChange: (value: T) => void
  options: ChoiceOption<T>[]
  columns?: 2 | 3 | 4
  className?: string
}

export function ChoiceGroup<T extends string | number>({
  label,
  hint,
  value,
  onChange,
  options,
  columns = 2,
  className,
}: ChoiceGroupProps<T>) {
  const gridCols =
    columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : columns === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2'

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-gray-300 mb-2">{label}</p>}
      {hint && <p className="text-xs text-amber-400/90 mb-2 -mt-1">{hint}</p>}
      <div
        className={cn(
          'grid gap-1.5 p-1.5 rounded-xl bg-black/50 border border-white/10',
          gridCols,
        )}
        role="group"
        aria-label={label}
      >
        {options.map((opt) => {
          const selected = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={opt.disabled}
              onClick={() => !opt.disabled && onChange(opt.value)}
              className={cn(
                'min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red/60',
                selected
                  ? 'bg-netflix-red text-white shadow-md shadow-red-900/35 scale-[1.02]'
                  : 'text-gray-300 hover:text-white hover:bg-white/8',
                opt.disabled && 'opacity-35 cursor-not-allowed hover:bg-transparent hover:text-gray-300',
              )}
              aria-pressed={selected}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
