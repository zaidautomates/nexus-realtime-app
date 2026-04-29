import { useEffect, useRef } from 'react'
import { MicOff, VideoOff, Monitor } from 'lucide-react'

export default function VideoTile({ stream, user, isLocal = false, audio = true, video = true, screensharing = false, width, height }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gray-900 border border-white/10 group ${screensharing ? 'ring-2 ring-green-400/50' : ''}`}
      style={width && height ? { width, height } : undefined}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${!video ? 'hidden' : ''}`}
        />
      ) : null}

      {!video || !stream ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'unknown'}`}
              alt={user?.displayName}
              className="rounded-full border-2 border-border"
              style={{
                width: height ? Math.min(80, height * 0.35) : 64,
                height: height ? Math.min(80, height * 0.35) : 64,
              }}
            />
            <span className="text-white/70 text-xs font-medium">
              {user?.displayName || user?.username || 'Unknown'}
            </span>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium truncate">
            {user?.displayName || user?.username || 'Unknown'}
            {isLocal && ' (You)'}
          </span>
          <div className="flex items-center gap-1.5">
            {!audio && (
              <div className="w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            {!video && (
              <div className="w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
            {screensharing && (
              <div className="w-6 h-6 rounded-full bg-green-500/90 flex items-center justify-center">
                <Monitor className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 opacity-100 group-hover:opacity-0 transition-opacity duration-200">
        <span className="text-white/90 text-xs font-medium bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {user?.displayName || 'Unknown'}
          {isLocal && ' (You)'}
        </span>
      </div>

      {!audio && (
        <div className="absolute top-3 right-3">
          <div className="w-7 h-7 rounded-full bg-red-500/90 backdrop-blur-sm flex items-center justify-center">
            <MicOff className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      {screensharing && (
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
            <Monitor className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-medium">Sharing</span>
          </div>
        </div>
      )}
    </div>
  )
}
