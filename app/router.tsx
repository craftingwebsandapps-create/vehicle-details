import { createBrowserRouter, redirect } from "react-router"

import Root from "./root"
import NotFoundPage from "~/pages/NotFoundPage"
import { mobileRoutes } from "~/routes/mobile-routes"
import { webRootHomeRoute, webRoutes } from "~/routes/web-routes"
import { adminRoutes } from "~/routes/admin-routes"

/** Matches `base` in `vite.config.ts` (subpath deploy). `"/"` → omit option. */
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "")
const routerOpts =
  routerBasename === "" ? {} : { basename: routerBasename }

export const router = createBrowserRouter(
  [
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
  ],
  routerOpts
)
