import { useEffect, useState } from 'react'
import ChatHeader from './components/ChatHeader'
import EmptyState from './components/EmptyState'
import MessageInput from './components/MessageInput'
import MessageList from './components/MessageList'
import { initialMessages } from './data/sampleMessages'

function App() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  const [connection, setConnection] = useState({ status: 'disconnected', username: null })
  const [messages, setMessages] = useState(initialMessages)
  const isConnected = connection.status === 'connected'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const handleConnect = (username) => {
    setConnection({ status: 'connected', username })
  }

  const handleDisconnect = () => {
    setConnection({ status: 'disconnected', username: null })
  }

  const handleSendMessage = (text) => {
    const now = new Date()
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        username: connection.username ?? 'Tú',
        time,
        text,
        isOwn: true,
      },
    ])
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-3xl flex-col overflow-hidden bg-white shadow-xl sm:my-4 sm:h-[calc(100vh-2rem)] sm:rounded-2xl sm:border sm:border-slate-200 dark:bg-slate-900 dark:sm:border-slate-700/60">
      <ChatHeader
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        connection={connection}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      {isConnected ? <MessageList messages={messages} /> : <EmptyState />}
      <MessageInput disabled={!isConnected} onSend={handleSendMessage} />
    </div>
  )
}

export default App
