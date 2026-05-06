import { createBrowserRouter, redirect } from "react-router"

import Root from "./root"
import NotFoundPage from "~/pages/NotFoundPage"
import { mobileRoutes } from "~/routes/mobile-routes"
import { webRoutes } from "~/routes/web-routes"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        loader: () => redirect("/web"),
      },
      {
        path: "home",
        loader: () => redirect("/web"),
      },
      {
        path: "app",
        loader: () => redirect("/mobile/dashboard"),
      },
      ...mobileRoutes,
      ...webRoutes,
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
])
