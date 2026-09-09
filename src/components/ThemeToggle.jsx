import { Moon, Sun } from 'lucide-react'
import { memo } from 'react'

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Cambiar tema"
      onClick={onToggle}
      className="relative inline-flex h-8 w-14 shrink-0 touch-manipulation items-center rounded-full border border-slate-300 bg-slate-100 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
    >
      <span
        className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 motion-reduce:transition-none dark:bg-slate-900 ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon size={14} className="text-slate-300" aria-hidden="true" />
        ) : (
          <Sun size={14} className="text-amber-500" aria-hidden="true" />
        )}
      </span>
    </button>
  )
}

export default memo(ThemeToggle)
