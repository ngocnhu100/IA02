import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

interface Photo {
  id: string
  author: string
  width: number
  height: number
  url: string
  download_url: string
}

type ViewMode = 'grid' | 'list'

function App() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef<HTMLDivElement>(null)
  const retryCount = useRef<Map<number, number>>(new Map())
  const maxRetries = 3

  const fetchPhotos = useCallback(async (pageNum: number, attempt = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      
      // Add a small delay for retries to avoid rate limiting
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
      
      const response = await fetch(`https://picsum.photos/v2/list?page=${pageNum}&limit=30`, {
        mode: 'cors',
        cache: 'default'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.length === 0) {
        setHasMore(false)
      } else {
        setPhotos(prev => pageNum === 1 ? data : [...prev, ...data])
        retryCount.current.delete(pageNum) // Reset retry count on success
      }
      
      setLoading(false)
      setLoadingMore(false)
    } catch (error) {
      console.error(`Error fetching photos (page ${pageNum}, attempt ${attempt}):`, error)
      
      const currentRetries = retryCount.current.get(pageNum) || 0
      
      // Only show error for initial load
      if (pageNum === 1) {
        setError(error instanceof Error ? error.message : 'Failed to fetch photos')
        setLoading(false)
        setLoadingMore(false)
      } else {
        // For subsequent pages, retry or skip
        if (currentRetries < maxRetries) {
          retryCount.current.set(pageNum, currentRetries + 1)
          console.log(`Retrying page ${pageNum} (attempt ${attempt + 1}/${maxRetries})...`)
          // Retry after a delay
          setTimeout(() => {
            fetchPhotos(pageNum, attempt + 1)
          }, 2000 * attempt)
        } else {
          // Skip this page and try the next one
          console.log(`Skipping page ${pageNum} after ${maxRetries} failed attempts`)
          retryCount.current.delete(pageNum)
          setLoadingMore(false)
          setPage(prev => prev + 1) // Try next page
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
    }
  }, [loadingMore, hasMore, loading])

  useEffect(() => {
    if (page > 1 && !loadingMore) {
      fetchPhotos(page)
    }
  }, [page, fetchPhotos, loadingMore])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-6 p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Picsum Photo Gallery
          </h1>
          <svg className="animate-spin h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-2xl font-semibold text-gray-700">Loading photos...</div>
          <div className="text-sm text-gray-500">Please wait while we fetch amazing images for you</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            Picsum Photo Gallery
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => {
                retryCount.current.clear()
                setPage(1)
                setPhotos([])
                setHasMore(true)
                fetchPhotos(1)
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
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
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
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
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
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
            <div 
              key={photo.id} 
              className={
                viewMode === 'grid'
                  ? 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer'
                  : 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row cursor-pointer'
              }
            >
              <img
                src={`https://picsum.photos/id/${photo.id}/300/200`}
                alt={`Photo by ${photo.author}`}
                className={
                  viewMode === 'grid'
                    ? 'w-full h-48 object-cover'
                    : 'w-full sm:w-64 h-48 sm:h-40 object-cover shrink-0'
                }
                loading="lazy"
              />
              <div className={viewMode === 'grid' ? 'p-4' : 'p-4 flex flex-col justify-cente grow'}>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                  Photographer
                </p>
                <p className="text-gray-800 font-semibold text-lg">
                  {photo.author}
                </p>
                {viewMode === 'list' && (
                  <p className="text-gray-500 text-sm mt-2">
                    {photo.width} x {photo.height}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Intersection Observer Target */}
        {hasMore && <div ref={observerTarget} className="h-10 mt-8" />}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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
