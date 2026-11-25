import { createBrowserRouter } from 'react-router'
import { accountPages, modules } from '@/data/navigation'
import { RootLayout } from '@/layouts/root-layout'
import { HomePage } from '@/pages/home-page'
import { ModulePage } from '@/pages/module-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      ...[...modules, ...accountPages].map(({ path, title, description }) => ({
        path,
        element: <ModulePage title={title} description={description} />,
      })),
      { path: '*', Component: NotFoundPage },
    ],
  },
])
