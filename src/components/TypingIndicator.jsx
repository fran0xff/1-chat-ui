import { memo } from 'react'

function typingLabel(users) {
  if (users.length === 1) return `${users[0]} está escribiendo…`
  if (users.length === 2) return `${users[0]} y ${users[1]} están escribiendo…`
  return `${users.length} personas están escribiendo…`
}

function TypingIndicator({ users }) {
  if (users.length === 0) return null

  return (
    <p className="px-4 pb-1 text-xs text-slate-400 italic sm:px-6 dark:text-slate-500">
      {typingLabel(users)}
    </p>
  )
}

export default memo(TypingIndicator)
