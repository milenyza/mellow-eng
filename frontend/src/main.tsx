import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource-variable/caveat'
import '@fontsource-variable/lora'
import '@fontsource-variable/nunito-sans'
import { ProgressProvider } from '@/components/progress/progress-provider'
import '@/styles/globals.css'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  </StrictMode>,
)
