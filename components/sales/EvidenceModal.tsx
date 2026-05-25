'use client'

import React, { useState } from 'react'
import { Camera } from 'lucide-react'
import Lightbox from '@/components/shared/Lightbox'

export function EvidenceButton({ images }: { images?: string[] }) {
  const [open, setOpen] = useState(false)
  if (!images || images.length === 0) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
        <Camera className="w-4 h-4" />
        <span className="text-xs font-medium">{images.length}</span>
      </button>
      <Lightbox open={open} onClose={() => setOpen(false)} images={images} title="Evidencia de Pago" />
    </>
  )
}