import { Link } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <FiAlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">The page you are looking for doesn't exist.</p>
        <Link
          to="/photos"
          className="inline-block px-6 py-3 bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors no-underline"
        >
          <span className="text-white">Back to Gallery</span>
        </Link>
      </div>
    </div>
  )
}
