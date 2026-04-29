import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Users, Folder, PenTool,
  Copy, Check, Shield, Wifi, WifiOff, Zap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../hooks/useSocket'
import { useWebRTC } from '../hooks/useWebRTC'
import VideoGrid from '../components/VideoGrid'
import ChatSidebar from '../components/ChatSidebar'
import FileSharePanel from '../components/FileSharePanel'
import ParticipantsPanel from '../components/ParticipantsPanel'
import Whiteboard from '../components/Whiteboard'
import ProfileModal from '../components/ProfileModal'
import { Button } from '../components/ui/button'

const SIDEBAR_TABS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'participants', icon: Users, label: 'People' },
  { id: 'files', icon: Folder, label: 'Files' },
]

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const [localStream, setLocalStream] = useState(null)
  const [audio, setAudio] = useState(true)
  const [video, setVideo] = useState(true)
  const [screensharing, setScreensharing] = useState(false)
  const [messages, setMessages] = useState([])
  const [sharedFiles, setSharedFiles] = useState([])
  const [peerStates, setPeerStates] = useState({})
  const [sidebarTab, setSidebarTab] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [whiteboardOpen, setWhiteboardOpen] = useState(false)
  const [unreadChat, setUnreadChat] = useState(0)
  const [copied, setCopied] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [mediaError, setMediaError] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const screenStreamRef = useRef(null)
  const localStreamRef = useRef(null)
  const startTime = useRef(Date.now())

  const { socket, connected } = useSocket(token)
  const { peers, addPeer, removePeer, replaceTrack } = useWebRTC({ socket, roomId, localStream })

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        localStreamRef.current = stream
        setMediaError(null)
      } catch (err) {
        console.warn('Media access denied:', err)
        setMediaError(err.message)
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true })
          setLocalStream(audioOnly)
          localStreamRef.current = audioOnly
          setVideo(false)
        } catch {
          setMediaError('No camera or microphone access')
        }
      }
    }
    initMedia()
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (!socket || !connected || !localStream) return

    socket.emit('room:join', { roomId })

    socket.on('room:peers', (existingPeers) => {
      existingPeers.forEach((peer) => addPeer(peer.socketId, peer))
    })

    socket.on('room:user-joined', (peerInfo) => {
      console.log('User joined:', peerInfo.displayName)
    })

    socket.on('room:user-left', ({ socketId }) => {
      removePeer(socketId)
      setPeerStates((prev) => { const s = { ...prev }; delete s[socketId]; return s })
    })

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg])
      if (sidebarTab !== 'chat' || !sidebarOpen) {
        setUnreadChat((n) => n + 1)
      }
    })

    socket.on('file:shared', (fileInfo) => {
      setSharedFiles((prev) => [...prev, fileInfo])
    })

    socket.on('user:media-state', ({ socketId, audio: a, video: v, screensharing: s }) => {
      setPeerStates((prev) => ({ ...prev, [socketId]: { audio: a, video: v, screensharing: s } }))
    })

    return () => {
      socket.off('room:peers')
      socket.off('room:user-joined')
      socket.off('room:user-left')
      socket.off('chat:message')
      socket.off('file:shared')
      socket.off('user:media-state')
    }
  }, [socket, connected, localStream, roomId, addPeer, removePeer])

  const emitMediaState = useCallback((a, v, s) => {
    if (socket) {
      socket.emit('user:media-state', { roomId, audio: a, video: v, screensharing: s })
    }
  }, [socket, roomId])

  const toggleAudio = () => {
    const newState = !audio
    localStream?.getAudioTracks().forEach((t) => { t.enabled = newState })
    setAudio(newState)
    emitMediaState(newState, video, screensharing)
  }

  const toggleVideo = () => {
    const newState = !video
    localStream?.getVideoTracks().forEach((t) => { t.enabled = newState })
    setVideo(newState)
    emitMediaState(audio, newState, screensharing)
  }

  const toggleScreenShare = async () => {
    if (screensharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      const cameraStream = localStreamRef.current
      const videoTrack = cameraStream?.getVideoTracks()[0]
      if (videoTrack) {
        replaceTrack(cameraStream, 'video')
        setLocalStream(cameraStream)
      }
      setScreensharing(false)
      emitMediaState(audio, video, false)
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        screenStreamRef.current = screenStream

        const combinedStream = new MediaStream([
          screenStream.getVideoTracks()[0],
          ...(localStreamRef.current?.getAudioTracks() || []),
        ])

        replaceTrack(screenStream, 'video')
        setLocalStream(combinedStream)
        setScreensharing(true)
        emitMediaState(audio, video, true)

        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare()
        }
      } catch (err) {
        console.warn('Screen share error:', err)
      }
    }
  }

  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    navigate('/dashboard')
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const openSidebarTab = (tabId) => {
    setSidebarTab(tabId)
    setSidebarOpen(true)
    if (tabId === 'chat') setUnreadChat(0)
  }

  const participantCount = 1 + Object.keys(peers).length

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 glass shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm gradient-text hidden sm:block">Nexus</span>
        </div>

        <div className="h-4 w-px bg-border/50 hidden sm:block" />

        <button
          onClick={copyRoomId}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 hover:border-border transition-all text-xs font-mono"
        >
          <span className="text-muted-foreground">Room:</span>
          <span className="font-bold tracking-wider">{roomId}</span>
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
        </button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{participantCount}</span>
        </div>

        <button
          onClick={() => setProfileOpen(true)}
          className="ml-auto mr-2 flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-border/50 transition-all duration-200 group"
          title="Edit profile"
        >
          <img
            src={user?.avatar}
            alt={user?.displayName}
            className="w-7 h-7 rounded-full border border-border group-hover:border-primary/50 transition-colors"
          />
          <span className="text-xs text-muted-foreground hidden sm:block group-hover:text-foreground transition-colors">{user?.displayName}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:block">{connected ? 'Connected' : 'Reconnecting...'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:block text-emerald-400">Encrypted</span>
          </div>

          <div className="text-xs font-mono text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
            {formatElapsed(elapsed)}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          {mediaError && (
            <div className="mx-3 mt-2 p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs shrink-0">
              ⚠️ {mediaError} — limited media access
            </div>
          )}
          <div className={`overflow-hidden p-3 min-h-0 ${whiteboardOpen ? 'flex-[3]' : 'flex-1'}`}>
            <VideoGrid
              localStream={localStream}
              localUser={user}
              localAudio={audio}
              localVideo={video}
              peers={peers}
              peerStates={peerStates}
            />
          </div>

          {whiteboardOpen && (
            <div className="flex-[2] border-t border-border/50 p-3 overflow-hidden min-h-0">
              <Whiteboard socket={socket} roomId={roomId} />
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="w-80 border-l border-border/50 flex flex-col shrink-0 animate-slide-in-right bg-card">
            <div className="flex border-b border-border/50 shrink-0">
              {SIDEBAR_TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => openSidebarTab(id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200 relative
                    ${sidebarTab === id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'chat' && unreadChat > 0 && (
                    <span className="absolute top-1.5 right-3 w-4 h-4 bg-primary rounded-full text-xs text-white flex items-center justify-center">
                      {unreadChat > 9 ? '9+' : unreadChat}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              {sidebarTab === 'chat' && (
                <ChatSidebar
                  socket={socket}
                  roomId={roomId}
                  user={user}
                  messages={messages}
                />
              )}
              {sidebarTab === 'participants' && (
                <ParticipantsPanel
                  user={user}
                  peers={peers}
                  peerStates={peerStates}
                  localAudio={audio}
                  localVideo={video}
                />
              )}
              {sidebarTab === 'files' && (
                <FileSharePanel
                  socket={socket}
                  roomId={roomId}
                  user={user}
                  sharedFiles={sharedFiles}
                  token={token}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/50 glass">
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          <ToolbarButton
            icon={audio ? Mic : MicOff}
            label={audio ? 'Mute' : 'Unmute'}
            onClick={toggleAudio}
            active={!audio}
            danger={!audio}
            title={audio ? 'Mute microphone' : 'Unmute microphone'}
          />
          <ToolbarButton
            icon={video ? Video : VideoOff}
            label={video ? 'Stop Video' : 'Start Video'}
            onClick={toggleVideo}
            active={!video}
            danger={!video}
            title={video ? 'Stop camera' : 'Start camera'}
          />
          <ToolbarButton
            icon={screensharing ? MonitorOff : Monitor}
            label={screensharing ? 'Stop Share' : 'Share Screen'}
            onClick={toggleScreenShare}
            active={screensharing}
            title={screensharing ? 'Stop screen sharing' : 'Share your screen'}
          />

          <div className="w-px h-8 bg-border/50 mx-1" />

          <ToolbarButton
            icon={PenTool}
            label="Whiteboard"
            onClick={() => setWhiteboardOpen(!whiteboardOpen)}
            active={whiteboardOpen}
            title="Toggle whiteboard"
          />

          <ToolbarButton
            icon={MessageSquare}
            label="Chat"
            onClick={() => {
              if (sidebarOpen && sidebarTab === 'chat') setSidebarOpen(false)
              else openSidebarTab('chat')
            }}
            active={sidebarOpen && sidebarTab === 'chat'}
            badge={unreadChat}
            title="Toggle chat"
          />

          <ToolbarButton
            icon={Users}
            label="People"
            onClick={() => {
              if (sidebarOpen && sidebarTab === 'participants') setSidebarOpen(false)
              else openSidebarTab('participants')
            }}
            active={sidebarOpen && sidebarTab === 'participants'}
            title="Toggle participants"
          />

          <ToolbarButton
            icon={Folder}
            label="Files"
            onClick={() => {
              if (sidebarOpen && sidebarTab === 'files') setSidebarOpen(false)
              else openSidebarTab('files')
            }}
            active={sidebarOpen && sidebarTab === 'files'}
            title="Toggle file sharing"
          />

          <div className="w-px h-8 bg-border/50 mx-1" />

          <button
            onClick={leaveRoom}
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg shadow-red-500/20"
            title="Leave room"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-medium">Leave</span>
          </button>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}

function ToolbarButton({ icon: Icon, label, onClick, active, danger, badge, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`toolbar-btn ${active ? (danger ? 'danger active' : 'active') : ''} relative`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs hidden sm:block">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-xs text-white flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
