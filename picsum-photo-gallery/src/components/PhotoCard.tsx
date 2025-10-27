import { Link } from 'react-router-dom'
import type { Photo } from '../types/photos'

type ViewMode = 'grid' | 'list'

export default function PhotoCard({ photo, viewMode }: { photo: Photo; viewMode: ViewMode }) {
  return (
    <Link
      to={`/photos/${photo.id}`}
      className={
        viewMode === 'grid'
          ? 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer'
          : 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row cursor-pointer'
      }
    >
      <img
        src={`https://picsum.photos/id/${photo.id}/300/200`}
        srcSet={`
          https://picsum.photos/id/${photo.id}/300/200 300w,
          https://picsum.photos/id/${photo.id}/600/400 600w
        `}
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
        alt={`Photo by ${photo.author}`}
        className={
          viewMode === 'grid'
            ? 'w-full h-48 object-cover'
            : 'w-full sm:w-64 h-48 sm:h-40 object-cover shrink-0'
        }
        loading="lazy"
      />
      <div className={viewMode === 'grid' ? 'p-4' : 'p-4 flex flex-col justify-center grow'}>
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
    </Link>
  )
}
