import type { RouteObject } from "react-router"

import WebLayout from "~/layouts/WebLayout"
import About from "~/pages/web/About"
import Contact from "~/pages/web/Contact"
import Home from "~/pages/web/Home"

export const webRoutes: RouteObject[] = [
  {
    path: "web",
    Component: WebLayout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "contact", Component: Contact },
    ],
  },
]
