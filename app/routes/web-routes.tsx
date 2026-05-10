import { lazy, Suspense } from "react"
import type { RouteObject } from "react-router"
import { redirect } from "react-router"

import WebLayout from "~/layouts/WebLayout"
import { PageLoader } from "~/components/ui/PageLoader"

const About = lazy(() => import("~/pages/web/About"))
const Contact = lazy(() => import("~/pages/web/Contact"))
const Home = lazy(() => import("~/pages/web/Home"))

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

/** Pathless layout: marketing home at `/` (same shell as `/web/*`). */
export const webRootHomeRoute: RouteObject = {
  Component: WebLayout,
  children: [{ index: true, element: withSuspense(Home) }],
}

export const webRoutes: RouteObject[] = [
  {
    path: "web",
    Component: WebLayout,
    children: [
      { index: true, loader: () => redirect("/") },
      { path: "about", element: withSuspense(About) },
      { path: "contact", element: withSuspense(Contact) },
    ],
  },
]
