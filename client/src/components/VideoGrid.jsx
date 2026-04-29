import { useRef, useEffect, useState, useCallback } from 'react'
import VideoTile from './VideoTile'

function getOptimalLayout(total, containerW, containerH) {
  if (total === 0) return { cols: 1, rows: 1 }

  let bestCols = 1
  let bestTileW = 0

  for (let cols = 1; cols <= total; cols++) {
    const rows = Math.ceil(total / cols)
    const tileW = (containerW - (cols - 1) * 12) / cols
    const tileH = (containerH - (rows - 1) * 12) / rows
    // Prefer tiles that are wide (16:9 feel) but stay within height
    const constrainedH = Math.min(tileH, tileW * (9 / 16))
    const constrainedW = constrainedH * (16 / 9)
    const totalUsed = constrainedW * cols
    if (totalUsed <= containerW && constrainedW > bestTileW) {
      bestTileW = constrainedW
      bestCols = cols
    }
  }

  return { cols: bestCols, rows: Math.ceil(total / bestCols) }
}

export default function VideoGrid({ localStream, localUser, localAudio, localVideo, peers, peerStates }) {
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  const peerList = Object.values(peers)
  const total = 1 + peerList.length

  const measure = useCallback(() => {
    if (containerRef.current) {
      setDims({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight,
      })
    }
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [measure])

  const { cols, rows } = dims.w && dims.h
    ? getOptimalLayout(total, dims.w, dims.h)
    : { cols: 1, rows: 1 }

  const gap = 12
  const tileW = dims.w > 0 ? (dims.w - (cols - 1) * gap) / cols : 0
  const tileH = dims.h > 0 ? (dims.h - (rows - 1) * gap) / rows : 0

  // Constrain to 16:9 and center the grid
  const constrainedH = tileW > 0 ? Math.min(tileH, tileW * (9 / 16)) : tileH
  const constrainedW = constrainedH > 0 ? constrainedH * (16 / 9) : tileW

  const gridW = constrainedW * cols + (cols - 1) * gap
  const gridH = constrainedH * rows + (rows - 1) * gap

  const tiles = [
    <VideoTile
      key="local"
      stream={localStream}
      user={localUser}
      isLocal
      audio={localAudio}
      video={localVideo}
      width={constrainedW}
      height={constrainedH}
    />,
    ...peerList.map((peer) => {
      const state = peerStates[peer.socketId] || {}
      return (
        <VideoTile
          key={peer.socketId}
          stream={peer.stream}
          user={peer}
          audio={state.audio !== false}
          video={state.video !== false}
          screensharing={!!state.screensharing}
          width={constrainedW}
          height={constrainedH}
        />
      )
    }),
  ]

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${constrainedW}px)`,
          gridTemplateRows: `repeat(${rows}, ${constrainedH}px)`,
          gap: `${gap}px`,
          width: gridW,
          height: gridH,
        }}
      >
        {tiles}
      </div>
    </div>
  )
}
