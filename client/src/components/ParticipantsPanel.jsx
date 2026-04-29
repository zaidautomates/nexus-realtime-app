import { Crown, Mic, MicOff, Video, VideoOff } from 'lucide-react'

export default function ParticipantsPanel({ user, peers, peerStates, localAudio, localVideo }) {
  const peerList = Object.values(peers)
  const total = 1 + peerList.length

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Participants</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{total} in room</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <ParticipantRow
          name={user?.displayName}
          avatar={user?.avatar}
          isLocal
          audio={localAudio}
          video={localVideo}
        />
        {peerList.map((peer) => {
          const state = peerStates[peer.socketId] || {}
          return (
            <ParticipantRow
              key={peer.socketId}
              name={peer.displayName}
              avatar={peer.avatar}
              audio={state.audio !== false}
              video={state.video !== false}
            />
          )
        })}
      </div>
    </div>
  )
}

function ParticipantRow({ name, avatar, isLocal, audio, video }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors">
      <div className="relative shrink-0">
        <img
          src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
          alt={name}
          className="w-9 h-9 rounded-full border border-border"
        />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${audio ? 'bg-green-400' : 'bg-red-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {name}
          {isLocal && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {audio ? <Mic className="w-3.5 h-3.5 text-green-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
        {video ? <Video className="w-3.5 h-3.5 text-green-400" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
      </div>
    </div>
  )
}
