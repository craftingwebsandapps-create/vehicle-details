import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import Root from "./root"
import Home from "./routes/home"
import "./app.css"

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
)
