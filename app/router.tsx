import { createBrowserRouter, redirect } from "react-router"

import Root from "./root"
import MobileLayout from "~/layouts/MobileLayout"
import WebLayout from "~/layouts/WebLayout"
import MobileHomePage from "~/pages/mobile/HomePage"
import OrdersPage from "~/pages/mobile/OrdersPage"
import ProfilePage from "~/pages/mobile/ProfilePage"
import SearchPage from "~/pages/mobile/SearchPage"
import NotFoundPage from "~/pages/NotFoundPage"
import AboutPage from "~/pages/web/AboutPage"
import ContactPage from "~/pages/web/ContactPage"
import WebHomePage from "~/pages/web/HomePage"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        loader: () => redirect("/home"),
      },
      {
        Component: WebLayout,
        children: [
          {
            path: "home",
            Component: WebHomePage,
          },
          {
            path: "about",
            Component: AboutPage,
          },
          {
            path: "contact",
            Component: ContactPage,
          },
        ],
      },
      {
        path: "app",
        Component: MobileLayout,
        children: [
          {
            index: true,
            loader: () => redirect("/app/home"),
          },
          {
            path: "home",
            Component: MobileHomePage,
          },
          {
            path: "search",
            Component: SearchPage,
          },
          {
            path: "orders",
            Component: OrdersPage,
          },
          {
            path: "profile",
            Component: ProfilePage,
          },
        ],
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
])