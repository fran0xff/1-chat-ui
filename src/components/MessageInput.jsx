import { Send, Smile } from 'lucide-react'
import { memo, useCallback, useRef, useState } from 'react'
import EmojiPicker from './EmojiPicker'

function MessageInput({ disabled, onSend, onTyping }) {
  const [draft, setDraft] = useState('')
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const inputRef = useRef(null)

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

  const handleSelectEmoji = useCallback(
    (emoji) => {
      const input = inputRef.current
      const start = input?.selectionStart ?? draft.length
      const end = input?.selectionEnd ?? draft.length
      setDraft(draft.slice(0, start) + emoji + draft.slice(end))
      onTyping?.()

      // Selection range is lost on the value update above; restore focus and
      // move the cursor to just after the inserted emoji on the next tick.
      requestAnimationFrame(() => {
        const cursor = start + emoji.length
        input?.focus()
        input?.setSelectionRange(cursor, cursor)
      })
    },
    [draft, onTyping],
  )

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-2xl items-center gap-2">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
            disabled={disabled}
            aria-label="Insertar emoticono"
            aria-expanded={isEmojiPickerOpen}
            className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-900"
          >
            <Smile size={18} aria-hidden="true" />
          </button>
          {isEmojiPickerOpen && !disabled && (
            <EmojiPicker onSelect={handleSelectEmoji} onClose={() => setIsEmojiPickerOpen(false)} />
          )}
        </div>

        <label htmlFor="message-input" className="sr-only">
          Mensaje
        </label>
        <input
          id="message-input"
          ref={inputRef}
          type="text"
          name="message"
          autoComplete="off"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            onTyping?.()
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Conéctate para escribir un mensaje…' : 'Escribe un mensaje…'}
          className="flex-1 rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus-visible:border-indigo-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-400/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:bg-slate-800"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !draft.trim()}
          aria-label="Enviar mensaje"
          className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm transition-colors hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:focus-visible:ring-offset-slate-900 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default memo(MessageInput)
