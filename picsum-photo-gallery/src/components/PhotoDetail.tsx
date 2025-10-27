import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiDownload, FiArrowLeft, FiUser, FiMaximize, FiExternalLink, FiAlertCircle } from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import type { Photo } from '../types/photos'
import { getPhotoInfo } from '../services/picsum'

function PhotoDetail() {
  const { id } = useParams<{ id: string }>()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite" aria-busy="true">
          <AiOutlineLoading3Quarters className="animate-spin h-12 w-12 text-blue-600" aria-hidden="true" />
          <p className="text-gray-700 text-lg">Loading photo details...</p>
        </div>
      </div>
    )
  }

  if (error || !photo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100" role="alert" aria-live="assertive">
        <div className="text-center max-w-md p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-red-600 mb-6">{error || 'Photo not found'}</p>
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
          </div>
        </div>
      </div>
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
          <div className="w-full bg-gray-900 flex items-center justify-center">
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
              onLoad={() => setImgLoaded(true)}
              className={`w-full max-h-[70vh] object-contain transition-opacity duration-700 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'} `}
            />
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
    </div>
  )
}

export default PhotoDetail
