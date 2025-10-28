import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiDownload, FiArrowLeft, FiUser, FiMaximize, FiExternalLink } from 'react-icons/fi'
import type { Photo } from '../types/photos'
import { getPhotoInfo } from '../services/picsum'
import LoadingOverlay from './LoadingOverlay'
import ErrorState from './ErrorState'
import FullscreenLightbox from './FullscreenLightbox'

function PhotoDetail() {
  const { id } = useParams<{ id: string }>()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const fetchPhotoDetail = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      setImgLoaded(false)
      if (!id) throw new Error('Invalid photo id')
      const data = await getPhotoInfo(id, signal)
      setPhoto(data)
    } catch (err: unknown) {
      // AbortController throws a DOMException with name 'AbortError' when aborted
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
    if (photo) {
      document.title = `Photo by ${photo.author} – Picsum`
    }
    return () => { document.title = 'Picsum Photo Gallery' }
  }, [photo])

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
        <FullscreenLightbox
          src={photo.download_url}
          alt={`Full-size photo by ${photo.author}`}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </div>
  )
}

export default PhotoDetail
