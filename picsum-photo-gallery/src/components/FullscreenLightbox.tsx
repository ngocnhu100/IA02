import { useEffect, useState, useCallback, useRef } from 'react'
import { FiX, FiZoomIn, FiZoomOut, FiRefreshCw } from 'react-icons/fi'
import type { Photo } from '../types/photos'

/**
 * Fullscreen viewer with zoom/pan and touch gestures. Locks body scroll and closes on overlay click or Escape.
 */
export default function FullscreenLightbox({
  photo,
  isOpen,
  onClose,
}: {
  photo: Photo
  isOpen: boolean
  onClose: () => void
}) {
  // Zoom bounds and step
  const MIN_ZOOM = 0.25
  const MAX_ZOOM = 2
  const ZOOM_STEP = 0.25

  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  // Store pinch gesture baseline and last touch info between events
  const pinchRef = useRef<{
    startScale: number
    startOffset: { x: number; y: number }
    startDist: number
    startCenter: { x: number; y: number }
    lastTouch?: { x: number; y: number }
    lastTapTs?: number
  }>({
    startScale: 1,
    startOffset: { x: 0, y: 0 },
    startDist: 0,
    startCenter: { x: 0, y: 0 },
  })

  // Lock body scroll and close on Escape
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  // Reset zoom/offset when opening
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
  }, [isOpen])

  /**
   * Clamp pan offset so the scaled image doesn't drift too far off-screen.
   * Computes contain-fit size, then bounds pan based on scale.
   */
  const clampOffset = useCallback((nx: number, ny: number, sc: number) => {
    const cont = containerRef.current
    const img = imgRef.current
    if (!cont || !img) return { x: nx, y: ny }
    const cw = cont.clientWidth
    const ch = cont.clientHeight
    const iw = img.naturalWidth || img.clientWidth
    const ih = img.naturalHeight || img.clientHeight
    // Fit image inside container (object-contain)
    const fit = Math.min(cw / iw, ch / ih)
    const dw = iw * fit
    const dh = ih * fit
    const sw = dw * sc
    const sh = dh * sc
    const maxX = Math.max(0, (sw - dw) / 2)
    const maxY = Math.max(0, (sh - dh) / 2)
    return {
      x: Math.max(-maxX, Math.min(nx, maxX)),
      y: Math.max(-maxY, Math.min(ny, maxY)),
    }
  }, [])

  // Touch gestures: pinch to zoom, double-tap to toggle zoom
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const center = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
      pinchRef.current.startScale = zoom
      pinchRef.current.startOffset = offset
      pinchRef.current.startDist = dist
      pinchRef.current.startCenter = center
    } else if (e.touches.length === 1) {
      const t = e.touches[0]
      pinchRef.current.lastTouch = { x: t.clientX, y: t.clientY }
    }
  }, [zoom, offset])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const center = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
      const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (pinchRef.current.startScale * dist) / Math.max(1, pinchRef.current.startDist)))
      // Translate relative to center movement
      const dx = center.x - pinchRef.current.startCenter.x
      const dy = center.y - pinchRef.current.startCenter.y
      const base = pinchRef.current.startOffset
      const { x, y } = clampOffset(base.x + dx, base.y + dy, nextScale)
      setZoom(nextScale)
      setOffset({ x, y })
    } else if (e.touches.length === 1 && zoom > 1) {
      e.preventDefault()
      const t = e.touches[0]
      const last = pinchRef.current.lastTouch
      if (last) {
        const nx = offset.x + (t.clientX - last.x)
        const ny = offset.y + (t.clientY - last.y)
        const c = clampOffset(nx, ny, zoom)
        setOffset(c)
      }
      pinchRef.current.lastTouch = { x: t.clientX, y: t.clientY }
    }
  }, [zoom, offset, clampOffset])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    // Double-tap to toggle zoom 1 <-> 2
    if (e.touches.length === 0) {
      const now = Date.now()
      const last = pinchRef.current.lastTapTs ?? 0
      if (now - last < 300) {
        const next = zoom > 1 ? 1 : 2
        setZoom(next)
        setOffset({ x: 0, y: 0 })
      }
      pinchRef.current.lastTapTs = now
      pinchRef.current.lastTouch = undefined
    }
  }, [zoom])

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overscroll-y-contain"
      role="dialog"
      aria-modal="true"
      aria-label="Full-size image viewer"
      title="Pinch to zoom. Double-tap to toggle zoom. Click anywhere or press Esc to close"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <button
        aria-label="Close full-size image"
        className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white z-50"
        style={{
          // Keep a minimum offset and honor device safe area to avoid being cut off
          top: 'max(1rem, env(safe-area-inset-top))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
        onClick={onClose}
      >
        <FiX className="w-5 h-5" />
      </button>

      {/* Zoomable image */}
      <img
        ref={imgRef}
        src={photo.download_url}
        alt={`Full-size photo by ${photo.author}`}
        decoding="async"
        className="max-w-none max-h-[90vh] shadow-2xl select-none touch-none"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          transition: 'transform 0.02s linear',
          willChange: 'transform',
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.preventDefault()
          const next = zoom > 1 ? 1 : 2
          setZoom(next)
          setOffset({ x: 0, y: 0 })
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-2 text-white">
        <button
          className="p-2 rounded-full hover:bg-white/10 focus:outline-none"
          aria-label="Zoom out"
          onClick={() => {
            const next = Math.max(MIN_ZOOM, +(zoom - ZOOM_STEP).toFixed(2))
            setZoom(next)
            setOffset((o) => clampOffset(o.x, o.y, next))
          }}
        >
          <FiZoomOut className="w-5 h-5" />
        </button>
        <span className="text-sm tabular-nums min-w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button
          className="p-2 rounded-full hover:bg-white/10 focus:outline-none"
          aria-label="Zoom in"
          onClick={() => {
            const next = Math.min(MAX_ZOOM, +(zoom + ZOOM_STEP).toFixed(2))
            setZoom(next)
            setOffset((o) => clampOffset(o.x, o.y, next))
          }}
        >
          <FiZoomIn className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-white/10 focus:outline-none"
          aria-label="Reset zoom"
          onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
