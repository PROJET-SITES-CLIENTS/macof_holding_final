import 'regenerator-runtime/runtime'
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

// Devtools chargés uniquement en développement (allège le bundle de production)
const LazyReactQueryDevtools = lazy(async () => {
  const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools')
  return { default: ReactQueryDevtools }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <LazyReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>,
)

// ─── Service Worker PWA (production uniquement) ────────────────────────────
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // L'échec d'enregistrement ne doit jamais bloquer le site
    })
  })
}
