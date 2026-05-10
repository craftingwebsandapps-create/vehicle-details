import { createBrowserRouter, redirect } from "react-router"

import Root from "./root"
import NotFoundPage from "~/pages/NotFoundPage"
import { mobileRoutes } from "~/routes/mobile-routes"
import { webRootHomeRoute, webRoutes } from "~/routes/web-routes"
import { adminRoutes } from "~/routes/admin-routes"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      webRootHomeRoute,
      {
        path: "home",
        loader: () => redirect("/"),
      },
      {
        path: "app",
        loader: () => redirect("/mobile/dashboard"),
      },
      ...mobileRoutes,
      ...webRoutes,
      ...adminRoutes,
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
])
