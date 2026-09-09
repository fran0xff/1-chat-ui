import { memo } from 'react'

const PALETTE = [
  { bg: 'bg-yellow-300', text: 'text-slate-900' },
  { bg: 'bg-sky-400', text: 'text-white' },
  { bg: 'bg-emerald-400', text: 'text-white' },
  { bg: 'bg-pink-400', text: 'text-white' },
  { bg: 'bg-orange-300', text: 'text-slate-900' },
  { bg: 'bg-fuchsia-400', text: 'text-white' },
]

// Module-level cache: the same username repeats across many messages,
// so palette/initials only need to be computed once per unique name.
const avatarCache = new Map()

function avatarForName(name) {
  const cached = avatarCache.get(name)
  if (cached) return cached

  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const palette = PALETTE[Math.abs(hash) % PALETTE.length]
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const result = { ...palette, initials }
  avatarCache.set(name, result)
  return result
}

function MessageBubble({ message }) {
  const { username, time, text, isOwn } = message
  const { bg, text: textColor, initials } = avatarForName(username)

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-slate-900 text-xs font-bold ${bg} ${textColor}`}
      >
        {initials}
      </div>

      <div className={`flex max-w-[75%] flex-col gap-1 sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {isOwn ? 'Tú' : username}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{time}</span>
        </div>

        <div className="relative">
          <span
            className={`absolute -bottom-1.5 z-0 h-4 w-4 rotate-45 rounded-[4px] border-[2.5px] border-slate-900 ${bg} ${
              isOwn ? 'right-2' : 'left-2'
            }`}
          />
          <div
            className={`relative z-10 rounded-3xl border-[2.5px] border-slate-900 px-4 py-2 text-sm font-semibold leading-relaxed shadow-[3px_3px_0_rgba(15,23,42,0.25)] ${bg} ${textColor}`}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(MessageBubble)
