import { useCallback, useEffect, useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080'

function formatTime(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function toUiMessage(message, ownUsername) {
  return {
    id: message.id,
    username: message.username,
    time: formatTime(message.timestamp),
    text: message.content,
    isOwn: message.username === ownUsername,
  }
}

// Wraps the chat broker's REST history endpoint and WebSocket broadcast in
// one connect/disconnect/send API, so components deal only in UI messages.
export function useChatConnection() {
  const [connection, setConnection] = useState({ status: 'disconnected', username: null })
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const socketRef = useRef(null)

  const connect = useCallback(async (username) => {
    setError(null)
    setConnection({ status: 'connecting', username })

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`)
      if (!response.ok) throw new Error(`unexpected status ${response.status}`)
      const history = await response.json()
      setMessages(history.map((message) => toUiMessage(message, username)))
    } catch {
      setError('No se pudo cargar el historial de mensajes.')
      setMessages([])
    }

    const socket = new WebSocket(`${WS_BASE_URL}/ws/chat?username=${encodeURIComponent(username)}`)
    socketRef.current = socket

    socket.addEventListener('open', () => {
      setConnection({ status: 'connected', username })
    })

    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'CHAT') {
        setMessages((prev) => [...prev, toUiMessage(data, username)])
      }
      // PRESENCE events (list of connected usernames) aren't surfaced in the UI yet.
    })

    socket.addEventListener('close', () => {
      socketRef.current = null
      setConnection({ status: 'disconnected', username: null })
    })

    socket.addEventListener('error', () => {
      setError('Se perdió la conexión con el servidor.')
    })
  }, [])

  const disconnect = useCallback(() => {
    socketRef.current?.close()
  }, [])

  const sendMessage = useCallback((text) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'CHAT', content: text }))
    }
  }, [])

  useEffect(() => () => socketRef.current?.close(), [])

  return { connection, messages, error, connect, disconnect, sendMessage }
}
