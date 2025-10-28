import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to top on route changes to avoid staying in the middle of a page.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Smoothly scroll to top-left whenever the route path changes
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}
