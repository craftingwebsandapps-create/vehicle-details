import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router"

import { AppProviders } from "~/providers"
import { router } from "./router"
import "./app.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)
