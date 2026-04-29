import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Plus, ArrowRight, Shield, Video, Monitor, FileText,
  PenTool, Users, Zap, Copy, Check, Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../lib/apiClient'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import ProfileModal from '../components/ProfileModal'

const features = [
  { icon: Video, title: 'HD Video Calling', desc: 'Multi-user video conferences with WebRTC', color: 'text-blue-400' },
  { icon: Monitor, title: 'Screen Sharing', desc: 'Share your screen with all participants', color: 'text-green-400' },
  { icon: FileText, title: 'File Sharing', desc: 'Encrypted file transfer in real-time', color: 'text-yellow-400' },
  { icon: PenTool, title: 'Whiteboard', desc: 'Collaborative drawing and writing', color: 'text-pink-400' },
  { icon: Shield, title: 'E2E Encrypted', desc: 'AES-256-GCM encryption on all data', color: 'text-emerald-400' },
  { icon: Users, title: 'Multi-User', desc: 'Support for multiple participants', color: 'text-violet-400' },
]

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [joinRoomId, setJoinRoomId] = useState('')
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState({ create: false, join: false })
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [createdRoom, setCreatedRoom] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    setError('')
    setLoading({ ...loading, create: true })
    try {
      const data = await apiClient.post('/api/rooms/create', { name: roomName }, token)
      setCreatedRoom(data.room)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading({ ...loading, create: false })
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    if (!joinRoomId.trim()) return
    setError('')
    setLoading({ ...loading, join: true })
    try {
      await apiClient.post('/api/rooms/join', { roomId: joinRoomId.toUpperCase() }, token)
      navigate(`/room/${joinRoomId.toUpperCase()}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading({ ...loading, join: false })
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(createdRoom.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const enterRoom = () => navigate(`/room/${createdRoom.id}`)

  return (
    <div className="min-h-screen gradient-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-border/50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Nexus</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-border/50 transition-all duration-200 group"
              title="Edit profile"
            >
              <div className="relative">
                <img
                  src={user?.avatar}
                  alt={user?.displayName}
                  className="w-8 h-8 rounded-full border border-border group-hover:border-primary/50 transition-colors"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-tight">{user?.displayName}</span>
                <span className="text-xs text-muted-foreground leading-tight">Edit profile</span>
              </div>
            </button>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out" className="text-muted-foreground hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.displayName}</span>
          </h2>
          <p className="text-muted-foreground">Start a meeting or join an existing room</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <Card className="glass border-white/10 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-2">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <CardTitle>Create a Room</CardTitle>
              <CardDescription>Start a new conference room and invite others</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}
              {createdRoom ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-400 font-medium mb-1">Room created!</p>
                    <p className="text-sm text-muted-foreground mb-3">Share this Room ID with participants:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 rounded-lg bg-background/50 border border-border font-mono text-lg font-bold tracking-widest text-center">
                        {createdRoom.id}
                      </div>
                      <Button variant="outline" size="icon" onClick={copyRoomId}>
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button variant="gradient" className="w-full" onClick={enterRoom}>
                    Enter Room <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <Input
                    placeholder="Room name (optional)"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    disabled={loading.create}
                  >
                    {loading.create ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create Room
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-white/10 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mb-2">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <CardTitle>Join a Room</CardTitle>
              <CardDescription>Enter a Room ID to join an existing conference</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <Input
                  placeholder="Enter Room ID (e.g. AB12C3)"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  className="font-mono tracking-widest text-center text-lg uppercase"
                  maxLength={8}
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-11 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  disabled={loading.join || !joinRoomId.trim()}
                >
                  {loading.join ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" /> Join Room
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-6 text-muted-foreground uppercase tracking-wider text-xs">
            Platform Features
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="glass border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
              >
                <Icon className={`w-6 h-6 ${color}`} />
                <p className="text-xs font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}
