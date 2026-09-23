import { useCallback, useEffect, useState } from 'react'
import ChatHeader from './components/ChatHeader'
import EmptyState from './components/EmptyState'
import MessageInput from './components/MessageInput'
import MessageList from './components/MessageList'
import TypingIndicator from './components/TypingIndicator'
import { useChatConnection } from './hooks/useChatConnection'

function App() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  const { connection, messages, typingUsers, error, connect, disconnect, sendMessage, sendTyping } =
    useChatConnection()
  const isConnected = connection.status === 'connected'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document
      .getElementById('theme-color-meta')
      ?.setAttribute('content', isDark ? '#0f172a' : '#f1f5f9')
  }, [isDark])

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => !prev)
  }, [])

  return (
    <div className="mx-auto flex h-screen w-full max-w-3xl flex-col overflow-hidden bg-white shadow-xl sm:my-4 sm:h-[calc(100vh-2rem)] sm:rounded-2xl sm:border sm:border-slate-200 dark:bg-slate-900 dark:sm:border-slate-700/60">
      <ChatHeader
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        connection={connection}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      {error && !isConnected && (
        <p className="bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-600 sm:px-6 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      {isConnected ? <MessageList messages={messages} /> : <EmptyState />}
      {isConnected && <TypingIndicator users={typingUsers} />}
      <MessageInput disabled={!isConnected} onSend={sendMessage} onTyping={sendTyping} />
    </div>
  )
}

export default App
