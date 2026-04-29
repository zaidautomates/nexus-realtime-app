import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

export function useSocket(token) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('Socket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      setConnected(false)
      console.log('Socket disconnected')
    })

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token])

  const emit = useCallback((event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data)
  }, [])

  const on = useCallback((event, handler) => {
    if (socketRef.current) socketRef.current.on(event, handler)
  }, [])

  const off = useCallback((event, handler) => {
    if (socketRef.current) socketRef.current.off(event, handler)
  }, [])

  return { socket: socketRef.current, connected, emit, on, off }
}
