import { useEffect, useRef, useState, useCallback } from 'react'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useWebRTC({ socket, roomId, localStream }) {
  const [peers, setPeers] = useState({})
  const peerConnections = useRef({})
  const pendingCandidates = useRef({})

  const createPeerConnection = useCallback((socketId, userInfo) => {
    if (peerConnections.current[socketId]) return peerConnections.current[socketId]

    const pc = new RTCPeerConnection(ICE_SERVERS)

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit('rtc:ice-candidate', { to: socketId, candidate: e.candidate, roomId })
      }
    }

    pc.ontrack = (e) => {
      const remoteStream = e.streams[0]
      setPeers((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], stream: remoteStream, ...userInfo },
      }))
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setPeers((prev) => {
          const updated = { ...prev }
          delete updated[socketId]
          return updated
        })
        delete peerConnections.current[socketId]
      }
    }

    peerConnections.current[socketId] = pc
    return pc
  }, [socket, roomId, localStream])

  const addPeer = useCallback(async (socketId, userInfo) => {
    const pc = createPeerConnection(socketId, userInfo)
    setPeers((prev) => ({ ...prev, [socketId]: { socketId, ...userInfo, stream: null } }))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('rtc:offer', { to: socketId, offer, roomId })
  }, [createPeerConnection, socket, roomId])

  const handleOffer = useCallback(async ({ from, offer, user: userInfo }) => {
    const pc = createPeerConnection(from, userInfo)
    setPeers((prev) => ({ ...prev, [from]: { socketId: from, ...userInfo, stream: null } }))

    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    if (pendingCandidates.current[from]) {
      for (const candidate of pendingCandidates.current[from]) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
      delete pendingCandidates.current[from]
    }

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket.emit('rtc:answer', { to: from, answer })
  }, [createPeerConnection, socket])

  const handleAnswer = useCallback(async ({ from, answer }) => {
    const pc = peerConnections.current[from]
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }, [])

  const handleIceCandidate = useCallback(async ({ from, candidate }) => {
    const pc = peerConnections.current[from]
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } else {
      if (!pendingCandidates.current[from]) pendingCandidates.current[from] = []
      pendingCandidates.current[from].push(candidate)
    }
  }, [])

  const removePeer = useCallback((socketId) => {
    const pc = peerConnections.current[socketId]
    if (pc) {
      pc.close()
      delete peerConnections.current[socketId]
    }
    setPeers((prev) => {
      const updated = { ...prev }
      delete updated[socketId]
      return updated
    })
  }, [])

  const replaceTrack = useCallback((newStream, kind) => {
    const newTrack = newStream.getTracks().find((t) => t.kind === kind)
    if (!newTrack) return
    Object.values(peerConnections.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === kind)
      if (sender) sender.replaceTrack(newTrack)
    })
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('rtc:offer', handleOffer)
    socket.on('rtc:answer', handleAnswer)
    socket.on('rtc:ice-candidate', handleIceCandidate)

    return () => {
      socket.off('rtc:offer', handleOffer)
      socket.off('rtc:answer', handleAnswer)
      socket.off('rtc:ice-candidate', handleIceCandidate)
    }
  }, [socket, handleOffer, handleAnswer, handleIceCandidate])

  useEffect(() => {
    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close())
      peerConnections.current = {}
    }
  }, [])

  return { peers, addPeer, removePeer, replaceTrack }
}
