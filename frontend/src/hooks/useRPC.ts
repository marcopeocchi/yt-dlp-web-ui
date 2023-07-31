import { useRecoilValue } from 'recoil'
import { rpcClientState } from '../atoms/rpc'

export const useRPC = () => {
  const client = useRecoilValue(rpcClientState)

  return {
    client,
    socket$: client.socket$
  }
}