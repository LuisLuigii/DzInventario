'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'

export default function Lightbox({ open, onClose, images = [], initialIndex = 0, title = '' }: {
  open: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  title?: string
}) {
  const [idx, setIdx] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const translateRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (open) { setIdx(initialIndex); resetZoom() }
  }, [open, initialIndex])

  const resetZoom = () => { setScale(1); setTranslate({ x: 0, y: 0 }); translateRef.current = { x: 0, y: 0 } }

  const prev = useCallback(() => { setIdx(i => Math.max(0, i - 1)); resetZoom() }, [])
  const next = useCallback(() => { setIdx(i => Math.min(images.length - 1, i + 1)); resetZoom() }, [images.length])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, prev, next, onClose])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.2 : -0.2
    setScale(s => {
      const next = Math.min(5, Math.max(1, s + delta))
      if (next <= 1) { setTranslate({ x: 0, y: 0 }); translateRef.current = { x: 0, y: 0 } }
      return next
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    isDragging.current = true
    hasDragged.current = false
    dragStart.current = { x: e.clientX - translateRef.current.x, y: e.clientY - translateRef.current.y }
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    hasDragged.current = true
    const nx = e.clientX - dragStart.current.x
    const ny = e.clientY - dragStart.current.y
    translateRef.current = { x: nx, y: ny }
    setTranslate({ x: nx, y: ny })
  }

  const handleMouseUp = () => { isDragging.current = false }

  if (!open || !images.length) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/97">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-black/40">
        <span className="text-white/70 text-sm font-medium truncate">{title || 'Imágenes'}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white/40 text-xs">{idx + 1} / {images.length}</span>
          <button onClick={() => setScale(s => Math.min(5, s + 0.5))} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => { if (scale <= 1.5) resetZoom(); else setScale(s => Math.max(1, s - 0.5)) }} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? 'grab' : 'default' }}
      >
        {images.length > 1 && (
          <button onClick={prev} disabled={idx === 0} className="absolute left-3 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 disabled:opacity-20 transition-all" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <img
          key={idx}
          src={images[idx]}
          alt={`Imagen ${idx + 1}`}
          onClick={() => { if (!hasDragged.current) setScale(s => s <= 1 ? 2 : 1) }}
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.15s ease',
            maxWidth: scale === 1 ? '100%' : 'none',
            maxHeight: scale === 1 ? 'calc(100vh - 130px)' : 'none',
            cursor: scale > 1 ? 'grab' : 'zoom-in',
          }}
          className="select-none rounded-md"
          draggable={false}
        />
        {images.length > 1 && (
          <button onClick={next} disabled={idx === images.length - 1} className="absolute right-3 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 disabled:opacity-20 transition-all" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-2 px-4 overflow-x-auto bg-black/40">
          {images.map((img, i) => (
            <button key={i} onClick={() => { setIdx(i); resetZoom() }}
              className={`flex-shrink-0 w-11 h-11 rounded overflow-hidden border-2 transition-all ${i === idx ? 'border-white opacity-100' : 'border-transparent opacity-35 hover:opacity-65'}`}>
              <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}