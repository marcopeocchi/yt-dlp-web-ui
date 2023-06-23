import { createContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RPCClient } from '../lib/rpcClient'
import { RootState } from '../stores/store'

type Props = {
  children: React.ReactNode
}

interface Context {
  client: RPCClient
}

export const RPCClientContext = createContext<Context>({
  client: new RPCClient()
})

export default function RPCCLientProvider({ children }: Props) {
  const settings = useSelector((state: RootState) => state.settings)

  const client = useMemo(() => new RPCClient(), [
    settings.serverAddr,
    settings.serverPort,
  ])

  return (
    <RPCClientContext.Provider value={{ client }}>
      {children}
    </RPCClientContext.Provider>
  )
}