# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 19 + Vite 8 single-page chat client (plain JavaScript/JSX, no TypeScript), styled with
Tailwind CSS v4 and `lucide-react` icons. UI text is in Spanish. It is the frontend for the
Spring Boot chat backend in the sibling repo `E:\ClaudeCode\2-chat-spingboot`; the app is
useless without that backend running on port 8080.

## Commands

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

There is no test runner configured. Lint uses **oxlint** (`.oxlintrc.json`), not ESLint.
`.claude/launch.json` defines the `chat-ui` preview (dev server on port 5173).

## Backend integration (Spring Boot WebSocket broker)

The backend is a **plain Spring WebSocket** (`TextWebSocketHandler`) that exchanges JSON
messages. It is not STOMP/SockJS, so never add `@stomp/stompjs` or `sockjs-client`; use the
native browser `WebSocket`.

Endpoints are configured in `.env` (see `.env.example`); if unset they default to localhost:8080:

- `VITE_API_BASE_URL` → REST: `GET /api/messages?limit=N` (history, chronological, backend
  default 50), `GET /api/users` (connected usernames; not used by the UI yet).
- `VITE_WS_BASE_URL` → `ws://…/ws/chat?username=<name>`. The server closes the socket
  immediately if `username` is missing.

Wire protocol:

| Direction | Payload |
|---|---|
| client → server | `{"type":"CHAT","content":"..."}`. The server attaches the username from the session, so the client never sends it. |
| server → all | `{"type":"CHAT","id","username","content","timestamp"}` after each message is saved, including the sender's own message (there is no optimistic insert). |
| server → others | `{"type":"JOIN","username","message","timestamp"}` when a user connects (`message` is a ready-made string like "Pedro se ha conectado al chat"); the server excludes the newly connected session so it doesn't see its own join notice. Rendered as a centered `SystemMessage`, not a `MessageBubble`. |
| client → server | `{"type":"TYPING"}` (no `content`) while the user has the message input focused and typing. `MessageInput` fires this on every `onChange`; the hook throttles it client-side to at most one send per `TYPING_THROTTLE_MS` (2s). |
| server → others | `{"type":"TYPING","username","timestamp"}`, excluding the typing session itself. The hook tracks per-username expiry timers (`TYPING_EXPIRY_MS`, 3s) and clears a user's typing state early if their `CHAT` message arrives first. Rendered by `TypingIndicator` ("Juan está escribiendo…"), not persisted anywhere. |
| server → all | `{"type":"PRESENCE","users":[...]}` on every connect/disconnect (currently ignored by the client) |

The backend allows CORS and WebSocket origins from `http://localhost:*`, so any Vite port
works in development. Other origins must be allowed in both `CorsConfig` and
`WebSocketConfig` on the backend.

## Architecture

All server communication is in one hook, `src/hooks/useChatConnection.js`, which exposes
`{ connection, messages, typingUsers, error, connect, disconnect, sendMessage, sendTyping }`.
It is the only place that knows about the backend's message shape.

- `connect(username)` first fetches the REST history, then opens the socket. The status goes
  `disconnected → connecting → connected` when the socket's `open` event fires.
- Backend messages are converted into one of two UI shapes, both carrying `{ id, kind, time }`:
  `toUiMessage` produces chat bubbles (`kind: 'chat'`, plus `username`, `text`, `isOwn`);
  `toSystemMessage` produces system notices (`kind: 'system'`, plus `text`) for events like
  `JOIN`. `MessageList` picks `MessageBubble` or `SystemMessage` per item based on `kind`. Add
  new server event types in the hook's `message` handler.
- The socket's `close` event resets the state to disconnected. No reconnection logic exists.

`App.jsx` owns the theme state and connection wiring. It shows `EmptyState` while
disconnected and `MessageList` when connected. Presentational components are wrapped in
`memo` and receive stable callbacks (`useCallback`); keep that pattern so typing in an input
does not re-render the message list.

Dark mode is class-based: `index.css` declares `@custom-variant dark (&:where(.dark, .dark *))`,
and `App` toggles `.dark` on `<html>` and updates `#theme-color-meta` in `index.html`. Use
`dark:` utilities, not `prefers-color-scheme` media queries.

## Available Skills

- **vercel-react-best-practices**: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
- **web-design-guidelines**: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
- **spring-boot-best-practices**: Scaffolds Spring Boot projects (Java 25, Maven, latest stable Spring Boot) with a controller/service/repository/model layered architecture, DTOs as records, explicit mappers, and Thymeleaf + Tailwind views for monoliths.

## Skills Trigger Rules

- Usa **vercel-react-best-practices** al escribir, revisar o refactorizar código React/Next.js: componentes nuevos, páginas, data fetching (cliente o servidor), optimización de bundle, re-renders o cualquier mejora de rendimiento.
- Usa **web-design-guidelines** cuando se pida revisar la UI, auditar el diseño, revisar accesibilidad/UX, o comparar el sitio contra buenas prácticas de interfaz.
- Usa **spring-boot-best-practices** al crear un proyecto Spring Boot (API REST o monolito con Spring Web), o al crear/agregar/modificar un entity, repository, service o controller en un proyecto Spring existente.
