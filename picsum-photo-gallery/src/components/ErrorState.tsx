import { FiAlertCircle } from 'react-icons/fi'
import type { PropsWithChildren } from 'react'

/**
 * Full-screen error message wrapper. Uses role="alert" for AT.
 */
export default function ErrorState({
  message,
  title = 'Oops! Something went wrong',
  children,
}: PropsWithChildren<{ message: string; title?: string }>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100" role="alert" aria-live="assertive">
      <div className="text-center max-w-md p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
          <p className="text-red-600 mb-6">{message}</p>
          <div className="flex justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
