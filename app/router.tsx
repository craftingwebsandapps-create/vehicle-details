import { createBrowserRouter, redirect } from "react-router"

import Root from "./root"
import MobileLayout from "~/layouts/MobileLayout"
import WebLayout from "~/layouts/WebLayout"
import AssignmentsPage from "~/pages/mobile/AssignmentsPage"
import DashboardPage from "~/pages/mobile/HomePage"
import DriversPage from "~/pages/mobile/DriversPage"
import SitesPage from "~/pages/mobile/SitesPage"
import VehiclesPage from "~/pages/mobile/VehiclesPage"
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
            loader: () => redirect("/app/dashboard"),
          },
          {
            path: "dashboard",
            Component: DashboardPage,
          },
          {
            path: "sites",
            Component: SitesPage,
          },
          {
            path: "vehicles",
            Component: VehiclesPage,
          },
          {
            path: "drivers",
            Component: DriversPage,
          },
          {
            path: "assignments",
            Component: AssignmentsPage,
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
