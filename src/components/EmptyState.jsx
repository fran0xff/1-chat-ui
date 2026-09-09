import { MessageCircleOff } from 'lucide-react'
import { memo } from 'react'

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
      >
        <MessageCircleOff size={24} />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Conéctate para ver los mensajes
      </p>
      <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
        Escribe tu nombre de usuario arriba y pulsa Conectar para unirte al chat.
      </p>
    </div>
  )
}

export default memo(EmptyState)
