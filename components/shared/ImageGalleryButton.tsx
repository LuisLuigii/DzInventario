'use client'

import React, { useState } from 'react'
import { Images } from 'lucide-react'
import Lightbox from './Lightbox'

export function ImageGalleryButton({ images, label = 'Imágenes' }: { images?: string[]; label?: string }) {
  const [open, setOpen] = useState(false)
  if (!images || images.length === 0) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
        <Images className="w-4 h-4" />
        <span className="text-xs font-medium">{images.length}</span>
      </button>
      <Lightbox open={open} onClose={() => setOpen(false)} images={images} title={label} />
    </>
  )
}