import { Send } from 'lucide-react'
import { memo, useCallback, useState } from 'react'

function MessageInput({ disabled, onSend }) {
  const [draft, setDraft] = useState('')

  const handleSend = useCallback(() => {
    const trimmed = draft.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setDraft('')
  }, [draft, disabled, onSend])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-2xl items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Conéctate para escribir un mensaje...' : 'Escribe un mensaje...'}
          className="flex-1 rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !draft.trim()}
          aria-label="Enviar mensaje"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

export default memo(MessageInput)
