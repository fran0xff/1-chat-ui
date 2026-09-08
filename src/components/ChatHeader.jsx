import { LogOut, MessageCircle, Plug } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

function ChatHeader({ isDark, onToggleTheme, connection, onConnect, onDisconnect }) {
  const [nameDraft, setNameDraft] = useState('')

  const handleConnect = (e) => {
    e.preventDefault()
    const trimmed = nameDraft.trim()
    if (!trimmed) return
    onConnect(trimmed)
    setNameDraft('')
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm">
          <MessageCircle size={18} />
        </div>
        <h1 className="text-base font-semibold text-slate-800 sm:text-lg dark:text-slate-100">
          Chat
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        {connection.status === 'connected' ? (
          <div className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-1 pl-3 dark:bg-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="max-w-[8rem] truncate text-sm font-medium text-slate-700 sm:max-w-none dark:text-slate-200">
              {connection.username}
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-red-950/60 dark:hover:text-red-400"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Desconectar</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="flex min-w-0 items-center gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Tu nombre de usuario..."
              className="w-32 min-w-0 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-400 focus:bg-white sm:w-48 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
            />
            <button
              type="submit"
              disabled={!nameDraft.trim()}
              className="flex shrink-0 items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plug size={14} />
              <span className="hidden sm:inline">Conectar</span>
            </button>
          </form>
        )}

        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}

export default ChatHeader
