import { useState, useRef } from 'react'
import { Upload, Download, FileText, Image, File, X, CheckCircle } from 'lucide-react'
import { formatFileSize, formatTime } from '../lib/utils'
import { Button } from './ui/button'

function getFileIcon(type) {
  if (type?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />
  if (type?.startsWith('text/')) return <FileText className="w-4 h-4 text-yellow-400" />
  return <File className="w-4 h-4 text-gray-400" />
}

export default function FileSharePanel({ socket, roomId, user, sharedFiles, token }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  const handleUpload = async (file) => {
    if (!file || !socket) return
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText))
          else reject(new Error('Upload failed'))
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', '/api/files/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })

      socket.emit('file:share', {
        roomId,
        fileInfo: {
          fileId: result.fileId,
          originalName: result.originalName,
          size: result.size,
          type: file.type,
          url: result.url,
          sharedBy: user.displayName,
          timestamp: new Date().toISOString(),
        },
      })
      setUploadProgress(100)
      setTimeout(() => { setUploading(false); setUploadProgress(0) }, 1000)
    } catch (err) {
      console.error('Upload error:', err)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">File Sharing</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Max 50MB per file · Encrypted transfer</p>
      </div>

      <div className="p-4 border-b border-border/50">
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
            ${dragOver ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}% uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Drop file or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Shared with all participants</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {sharedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">No files shared yet</p>
          </div>
        ) : (
          sharedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-border transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{file.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} · {file.sharedBy} · {formatTime(file.timestamp)}
                </p>
              </div>
              <a
                href={file.url}
                download={file.originalName}
                target="_blank"
                rel="noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
