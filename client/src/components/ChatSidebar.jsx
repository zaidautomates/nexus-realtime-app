import { useState, useEffect, useRef } from 'react'
import { Send, Lock } from 'lucide-react'
import { formatTime } from '../lib/utils'
import { encryptMessage, decryptMessage } from '../lib/encryption'
import { Button } from './ui/button'
import { Input } from './ui/input'

export default function ChatSidebar({ socket, roomId, user, messages, onNewMessage }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !socket) return
    setSending(true)
    try {
      const encrypted = await encryptMessage(input.trim())
      socket.emit('chat:message', { roomId, message: input.trim(), encrypted })
      setInput('')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Room Chat</h3>
          <div className="flex items-center gap-1 ml-auto">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400">Encrypted</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-50">
            <Lock className="w-8 h-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Messages are end-to-end encrypted</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isOwn={msg.userId === user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border/50">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm h-9"
            disabled={!socket}
          />
          <Button type="submit" size="icon" variant="gradient" disabled={!input.trim() || sending} className="h-9 w-9 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ msg, isOwn }) {
  const [decrypted, setDecrypted] = useState(null)

  useEffect(() => {
    if (msg.encrypted) {
      decryptMessage(msg.encrypted).then(setDecrypted).catch(() => setDecrypted(msg.message))
    } else {
      setDecrypted(msg.message)
    }
  }, [msg])

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <img
        src={msg.avatar}
        alt={msg.displayName}
        className="w-6 h-6 rounded-full border border-border shrink-0 mt-1"
      />
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        <span className={`text-xs text-muted-foreground ${isOwn ? 'text-right' : 'text-left'}`}>
          {isOwn ? 'You' : msg.displayName} · {formatTime(msg.timestamp)}
        </span>
        <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
          isOwn
            ? 'bg-primary/90 text-primary-foreground rounded-tr-sm'
            : 'bg-secondary text-foreground rounded-tl-sm'
        }`}>
          {decrypted ?? (
            <span className="opacity-50 italic text-xs">Decrypting...</span>
          )}
        </div>
      </div>
    </div>
  )
}
