import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiDownload, FiArrowLeft, FiUser, FiMaximize, FiExternalLink, FiX, FiZoomIn, FiZoomOut, FiRefreshCw } from 'react-icons/fi'
import type { Photo } from '../types/photos'
import { getPhotoInfo } from '../services/picsum'
import LoadingOverlay from './LoadingOverlay'
import ErrorState from './ErrorState'

// Detail page: fetch photo and provide fullscreen zoom/pan viewer
function PhotoDetail() {
  const { id } = useParams<{ id: string }>()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Zoom bounds and step
  const MIN_ZOOM = 0.25
  const MAX_ZOOM = 2
  const ZOOM_STEP = 0.25

  const [isFullscreen, setIsFullscreen] = useState(false)
  // Zoom/pan state for fullscreen on mobile
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
  }>({ startScale: 1, startOffset: { x: 0, y: 0 }, startDist: 0, startCenter: { x: 0, y: 0 } })

  // Fetch photo details; supports AbortSignal to cancel on navigation
  const fetchPhotoDetail = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      setImgLoaded(false)
      if (!id) throw new Error('Invalid photo id')
      const data = await getPhotoInfo(id, signal)
      setPhoto(data)
    } catch (err: unknown) {
      // Ignore AbortError when request is cancelled
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load photo')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    // Abort in-flight request when navigating away
    const controller = new AbortController()
    fetchPhotoDetail(controller.signal)
    return () => controller.abort()
  }, [id, fetchPhotoDetail])

  useEffect(() => {
    // Set contextual document title; restore on unmount
    if (photo) {
      document.title = `Photo by ${photo.author} – Picsum`
    }
    return () => { document.title = 'Picsum Photo Gallery' }
  }, [photo])

  useEffect(() => {
    // Lock scroll and close on Escape while in fullscreen
    if (!isFullscreen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', handleKey) }
  }, [isFullscreen])

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

  if (loading) {
    return (
      <LoadingOverlay>
        <p className="text-gray-700 text-lg">Loading photo details...</p>
      </LoadingOverlay>
    )
  }

  if (error || !photo) {
    return (
      <ErrorState message={error || 'Photo not found'}>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { void fetchPhotoDetail(); }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700"
          >
            Try Again
          </button>
          <Link
            to="/photos"
            className="px-6 py-3 bg-white text-gray-900 visited:text-gray-900 active:text-gray-900 no-underline border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-600"
          >
            <span>Back to Gallery</span>
          </Link>
        </div>
      </ErrorState>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          to="/photos"
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-700 text-white visited:text-white active:text-white no-underline text-sm shadow hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4 text-white" aria-hidden="true" />
          <span className="text-white">Back to Gallery</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden">
          {/* Full Size Image with Skeleton */}
          <div
            className="relative group w-full bg-gray-900 flex items-center justify-center cursor-zoom-in"
            role="button"
            tabIndex={0}
            aria-label="View full-size image"
            title="Click to view full-size"
            onClick={() => setIsFullscreen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsFullscreen(true)
              }
            }}
          >
            {!imgLoaded && (
              <div className="w-full h-[60vh] sm:h-[70vh] animate-pulse bg-gray-800" />
            )}
            <img
              src={`https://picsum.photos/id/${photo.id}/1200/800`}
              srcSet={`
                https://picsum.photos/id/${photo.id}/600/400 600w,
                https://picsum.photos/id/${photo.id}/900/600 900w,
                https://picsum.photos/id/${photo.id}/1200/800 1200w
              `}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              alt={`Photo by ${photo.author}`}
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              className={`w-full max-h-[70vh] object-contain transition-opacity duration-700 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'} `}
            />
            {/* Click hint */}
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/10 text-white backdrop-blur px-2.5 py-1.5 text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <FiMaximize className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Click to enlarge</span>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Title */}
              <div className="md:col-span-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Photo Title</h3>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                  {photo.author}'s Photography
                </h1>
              </div>

              {/* Meta cards */}
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    <FiUser className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    Author
                  </div>
                  <p className="mt-1 text-lg text-gray-800 font-medium">{photo.author}</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    <FiMaximize className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    Dimensions
                  </div>
                  <p className="mt-1 text-gray-800">{photo.width} × {photo.height} pixels</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="text-gray-700 leading-7">
                This stunning photograph captured by {photo.author} showcases the beauty of natural
                composition and lighting. The image demonstrates excellent technical execution with a
                resolution of {photo.width}×{photo.height} pixels, making it perfect for various display
                purposes. This high-quality photograph is part of the Lorem Picsum collection, curated to
                provide beautiful, copyright-free images.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={photo.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white visited:text-white active:text-white no-underline px-5 py-2.5 font-semibold shadow-lg hover:bg-blue-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700"
              >
                <FiDownload className="w-5 h-5 text-white" aria-hidden="true" />
                <span className="text-white">Download Original</span>
              </a>
              <a
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                <FiExternalLink className="w-5 h-5" aria-hidden="true" />
                View on Unsplash
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overscroll-y-contain"
          role="dialog"
          aria-modal="true"
          aria-label="Full-size image viewer"
          title="Pinch to zoom. Double-tap to toggle zoom. Click anywhere or press Esc to close"
          onClick={(e) => { if (e.target === e.currentTarget) setIsFullscreen(false) }}
        >
          <button
            aria-label="Close full-size image"
            className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
            onClick={() => setIsFullscreen(false)}
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

          {/* Close hint */}
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-xs sm:text-sm">
            Pinch to zoom. Tap outside or press Esc to close
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoDetail
