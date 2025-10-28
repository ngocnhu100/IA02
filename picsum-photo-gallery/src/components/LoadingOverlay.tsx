import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import type { PropsWithChildren } from 'react'

type Size = 'sm' | 'md' | 'lg'
const sizeClass: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

export default function LoadingOverlay({
  children,
  size = 'lg',
}: PropsWithChildren<{ size?: Size }>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite" aria-busy="true">
        <AiOutlineLoading3Quarters className={`animate-spin text-blue-600 ${sizeClass[size]}`} aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
