import { useEffect } from 'react'
import { FiX } from 'react-icons/fi'

export default function FullscreenLightbox({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  // Lock body scroll and close on Escape
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Full-size image viewer"
      title="Click anywhere or press Esc to close"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        aria-label="Close full-size image"
        className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
        onClick={onClose}
      >
        <FiX className="w-5 h-5" />
      </button>
      <img
        src={src}
        alt={alt}
        decoding="async"
        className="max-w-none max-h-[90vh] shadow-2xl cursor-zoom-out"
        onClick={onClose}
      />
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
        Click anywhere or press Esc to close
      </div>
    </div>
  )
}
