import { useCallback, useEffect, useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080'

// A user is considered done typing if no new TYPING event for them arrives within this window.
const TYPING_EXPIRY_MS = 3000
// Caps how often this client sends its own TYPING event, so typing a whole
// message doesn't send one per keystroke.
const TYPING_THROTTLE_MS = 2000

function formatTime(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function toUiMessage(message, ownUsername) {
  return {
    id: message.id,
    kind: 'chat',
    username: message.username,
    time: formatTime(message.timestamp),
    text: message.content,
    isOwn: message.username === ownUsername,
  }
}

function toSystemMessage(event) {
  return {
    id: `${event.type}-${event.username}-${event.timestamp}`,
    kind: 'system',
    text: event.message,
    time: formatTime(event.timestamp),
  }
}

// Wraps the chat broker's REST history endpoint and WebSocket broadcast in
// one connect/disconnect/send API, so components deal only in UI messages.
export function useChatConnection() {
  const [connection, setConnection] = useState({ status: 'disconnected', username: null })
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [error, setError] = useState(null)
  const socketRef = useRef(null)
  const typingTimeoutsRef = useRef(new Map())
  const lastTypingSentRef = useRef(0)

  const clearTypingUser = useCallback((typer) => {
    clearTimeout(typingTimeoutsRef.current.get(typer))
    typingTimeoutsRef.current.delete(typer)
    setTypingUsers((prev) => prev.filter((u) => u !== typer))
  }, [])

  const resetTyping = useCallback(() => {
    typingTimeoutsRef.current.forEach(clearTimeout)
    typingTimeoutsRef.current.clear()
    setTypingUsers([])
  }, [])

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
        clearTypingUser(data.username)
      } else if (data.type === 'JOIN') {
        setMessages((prev) => [...prev, toSystemMessage(data)])
      } else if (data.type === 'TYPING') {
        setTypingUsers((prev) => (prev.includes(data.username) ? prev : [...prev, data.username]))
        clearTimeout(typingTimeoutsRef.current.get(data.username))
        typingTimeoutsRef.current.set(
          data.username,
          setTimeout(() => clearTypingUser(data.username), TYPING_EXPIRY_MS),
        )
      }
      // PRESENCE events (list of connected usernames) aren't surfaced in the UI yet.
    })

    socket.addEventListener('close', () => {
      socketRef.current = null
      setConnection({ status: 'disconnected', username: null })
      resetTyping()
    })

    socket.addEventListener('error', () => {
      setError('Se perdió la conexión con el servidor.')
    })
  }, [clearTypingUser, resetTyping])

  const disconnect = useCallback(() => {
    socketRef.current?.close()
  }, [])

  const sendMessage = useCallback((text) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'CHAT', content: text }))
    }
  }, [])

  const sendTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      lastTypingSentRef.current = now
      socket.send(JSON.stringify({ type: 'TYPING' }))
    }
  }, [])

  useEffect(() => {
    const timeouts = typingTimeoutsRef.current
    return () => {
      socketRef.current?.close()
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return { connection, messages, typingUsers, error, connect, disconnect, sendMessage, sendTyping }
}
