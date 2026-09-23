import { memo } from 'react'

function SystemMessage({ message }) {
  return (
    <div className="flex justify-center">
      <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
        {message.text}
      </span>
    </div>
  )
}

export default memo(SystemMessage)
