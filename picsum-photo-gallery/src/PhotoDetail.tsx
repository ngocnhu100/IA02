import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiDownload, FiArrowLeft, FiUser, FiMaximize, FiExternalLink, FiAlertCircle } from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

interface PhotoDetail {
  id: string
  author: string
  width: number
  height: number
  url: string
  download_url: string
}

function PhotoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState<PhotoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false) // smooth image load

  useEffect(() => {
    const fetchPhotoDetail = async () => {
      try {
        setLoading(true)
        const response = await fetch(`https://picsum.photos/id/${id}/info`)
        
        if (!response.ok) {
          throw new Error('Photo not found')
        }
        
        const data = await response.json()
        setPhoto(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load photo')
        setLoading(false)
      }
    }

    if (id) {
      fetchPhotoDetail()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <AiOutlineLoading3Quarters className="animate-spin h-12 w-12 text-blue-500" aria-hidden="true" />
          <p className="text-gray-600 text-lg">Loading photo details...</p>
        </div>
      </div>
    )
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error || 'Photo not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-sm text-white shadow hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-800 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Gallery
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden">
          {/* Full Size Image with Skeleton */}
          <div className="w-full bg-gray-900 flex items-center justify-center">
            {!imgLoaded && (
              <div className="w-full h-[60vh] sm:h-[70vh] animate-pulse bg-gray-800" />
            )}
            <img
              src={`https://picsum.photos/id/${photo.id}/1200/800`}
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
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-white font-semibold shadow-lg hover:bg-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
              >
                <FiDownload className="w-5 h-5" aria-hidden="true" />
                Download Original
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
