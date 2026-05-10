import type { ReactNode } from "react"
import { Provider } from "react-redux"

import { store } from "~/app/store"
import { TooltipProvider } from "~/components/ui/tooltip"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <TooltipProvider>{children}</TooltipProvider>
    </Provider>
  )
}
