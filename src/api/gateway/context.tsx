/* eslint-disable react-refresh/only-export-components -- provider and hook share one gateway boundary. */
import { createContext, useContext } from "react"
import type { Gateway } from "./client"

const GatewayContext = createContext<Gateway | null>(null)

export function GatewayProvider({
  gateway,
  children,
}: {
  gateway: Gateway
  children: React.ReactNode
}) {
  return (
    <GatewayContext.Provider value={gateway}>
      {children}
    </GatewayContext.Provider>
  )
}

export function useGateway(): Gateway {
  const gateway = useContext(GatewayContext)
  if (gateway === null)
    throw new Error("useGateway must be used within GatewayProvider")
  return gateway
}
