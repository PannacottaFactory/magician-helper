import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/globals.css'

// The app loaded fine: allow a future automatic reload if a deploy makes old code files disappear
window.setTimeout(() => {
  try {
    sessionStorage.removeItem('mh:chunk-reload')
  } catch {
    // ignore
  }
}, 10_000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
