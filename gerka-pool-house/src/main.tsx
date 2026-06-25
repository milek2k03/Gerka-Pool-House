import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import './index.css'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

if (window.location.hash) {
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}`,
  )
}

window.scrollTo(0, 0)

const resetInitialScroll = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

window.addEventListener('pageshow', resetInitialScroll, { once: true })
window.requestAnimationFrame(() => window.requestAnimationFrame(resetInitialScroll))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
