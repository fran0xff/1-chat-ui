import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

function MessageList({ messages }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-6 dark:bg-slate-950">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default MessageList
