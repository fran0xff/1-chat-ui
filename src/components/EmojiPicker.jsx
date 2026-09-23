import { memo, useEffect, useRef } from 'react'

const EMOJIS = [
  '😀', '😂', '😅', '😊', '😍', '😘', '😜', '🤔', '😎', '😭',
  '😡', '😱', '🥳', '🥲', '😴', '🤗', '🤯', '🤣', '😇', '🙄',
  '👍', '👎', '🙏', '👏', '💪', '🙌', '👋', '🤝', '👀', '✌️',
  '❤️', '🔥', '✨', '🎉', '💯', '⭐', '✅', '❌', '☕', '🍕',
]

function EmojiPicker({ onSelect, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    function handlePointerDown(e) {
      if (!panelRef.current?.contains(e.target)) onClose()
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Selector de emoticonos"
      className="absolute bottom-full left-0 z-10 mb-2 grid w-64 grid-cols-8 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitem"
          onClick={() => onSelect(emoji)}
          aria-label={emoji}
          className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg text-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export default memo(EmojiPicker)
