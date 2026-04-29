import { useEffect, useRef, useState, useCallback } from 'react'
import { Pencil, Eraser, Trash2, Download, Minus, Plus, Square, Circle, Minus as LineIcon } from 'lucide-react'
import { Button } from './ui/button'

const COLORS = ['#ffffff', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']
const TOOLS = [
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
]

export default function Whiteboard({ socket, roomId }) {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef(null)
  const ctxRef = useRef(null)

  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx

    const resize = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.putImageData(imageData, 0, 0)
    }

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('whiteboard:draw', (data) => {
      drawOnCanvas(data, false)
    })

    socket.on('whiteboard:clear', () => {
      clearCanvas(false)
    })

    return () => {
      socket.off('whiteboard:draw')
      socket.off('whiteboard:clear')
    }
  }, [socket])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const drawOnCanvas = useCallback((data, emit = true) => {
    const ctx = ctxRef.current
    if (!ctx) return

    ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = data.color
    ctx.lineWidth = data.brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(data.from.x, data.from.y)
    ctx.lineTo(data.to.x, data.to.y)
    ctx.stroke()

    if (emit && socket) {
      socket.emit('whiteboard:draw', { roomId, drawData: data })
    }
  }, [socket, roomId])

  const clearCanvas = useCallback((emit = true) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (emit && socket) socket.emit('whiteboard:clear', { roomId })
  }, [socket, roomId])

  const exportCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const handleMouseDown = (e) => {
    isDrawing.current = true
    const canvas = canvasRef.current
    lastPos.current = getPos(e, canvas)
  }

  const handleMouseMove = (e) => {
    if (!isDrawing.current || !lastPos.current) return
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)

    drawOnCanvas({
      from: lastPos.current,
      to: pos,
      tool,
      color,
      brushSize: tool === 'eraser' ? brushSize * 4 : brushSize,
    }, true)

    lastPos.current = pos
  }

  const handleMouseUp = () => {
    isDrawing.current = false
    lastPos.current = null
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a] rounded-xl overflow-hidden border border-border/50">
      <div className="flex items-center gap-2 p-3 border-b border-border/50 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={label}
              className={`p-2 rounded-md transition-all duration-150 ${
                tool === id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground">{brushSize}px</span>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => setBrushSize(Math.min(30, brushSize + 1))}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={exportCanvas} title="Export PNG">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => clearCanvas(true)}
            title="Clear board"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
      </div>
    </div>
  )
}
