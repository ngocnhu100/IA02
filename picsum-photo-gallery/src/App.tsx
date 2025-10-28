import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import './App.css'
import { FiGrid, FiList } from 'react-icons/fi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import type { Photo } from './types/photos'
import PhotoCard from './components/PhotoCard'
import { getPhotosPage } from './services/picsum'
import LoadingOverlay from './components/LoadingOverlay'
import ErrorState from './components/ErrorState'

type ViewMode = 'grid' | 'list'

function App() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const param = new URLSearchParams(window.location.search).get('view')
    const saved = localStorage.getItem('viewMode') as ViewMode | null
    return (param === 'list' || param === 'grid') ? (param as ViewMode) : (saved ?? 'grid')
  })
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef<HTMLDivElement>(null)
  const retryCount = useRef<Map<number, number>>(new Map())
  const maxRetries = 3
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    document.title = 'Picsum Photo Gallery'
  }, [])

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (viewMode === 'grid') next.delete('view')
      else next.set('view', viewMode)
      return next
    }, { replace: true })
  }, [viewMode, setSearchParams])

  const fetchPhotos = useCallback(async (pageNum: number, attempt = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }

      const data = await getPhotosPage(pageNum, 36)

      if (data.length === 0) {
        setHasMore(false)
      } else {
        setPhotos(prev => pageNum === 1 ? data : [...prev, ...data])
        retryCount.current.delete(pageNum)
      }

      setLoading(false)
      setLoadingMore(false)
    } catch (error) {
      console.error(`Error fetching photos (page ${pageNum}, attempt ${attempt}):`, error)

      const currentRetries = retryCount.current.get(pageNum) || 0

      if (pageNum === 1) {
        setError(error instanceof Error ? error.message : 'Failed to fetch photos')
        setLoading(false)
        setLoadingMore(false)
      } else {
        if (currentRetries < maxRetries) {
          retryCount.current.set(pageNum, currentRetries + 1)
          setTimeout(() => {
            fetchPhotos(pageNum, attempt + 1)
          }, 2000 * attempt)
        } else {
          retryCount.current.delete(pageNum)
          setLoadingMore(false)
          setPage(prev => prev + 1)
        }
      }
    }
  }, [])

  useEffect(() => {
    fetchPhotos(1)
  }, [fetchPhotos])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && !loading) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
      observer.disconnect()
    }
  }, [loadingMore, hasMore, loading])

  // Fetch when page changes (do not depend on/loadingMore or gate on it)
  useEffect(() => {
    if (page > 1) {
      fetchPhotos(page)
    }
  }, [page, fetchPhotos])

  if (loading) {
    return (
      <LoadingOverlay>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Picsum Photo Gallery
        </h1>
        <div className="text-2xl font-semibold text-gray-700">Loading photos...</div>
        <div className="text-sm text-gray-500">Please wait while we fetch amazing images for you</div>
      </LoadingOverlay>
    )
  }

  if (error) {
    return (
      <ErrorState message={error}>
        <button
          onClick={() => {
            retryCount.current.clear()
            setPage(1)
            setPhotos([])
            setHasMore(true)
            fetchPhotos(1)
          }}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg"
        >
          Try Again
        </button>
      </ErrorState>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Picsum Photo Gallery
          </h1>
          
          <div className="flex gap-2 bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Grid view"
            >
              <FiGrid className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="List view"
            >
              <FiList className="w-5 h-5" aria-hidden="true" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
        
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
        }>
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} viewMode={viewMode} />
          ))}
        </div>

        {/* Intersection Observer Target */}
        {hasMore && <div ref={observerTarget} className="h-10 mt-8" />}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <AiOutlineLoading3Quarters className="animate-spin h-6 w-6" aria-hidden="true" />
              <span className="text-lg">Loading more photos...</span>
            </div>
          </div>
        )}

        {/* End of List Message */}
        {!hasMore && !loadingMore && photos.length > 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500 text-lg">
              You've reached the end of the photo gallery!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
