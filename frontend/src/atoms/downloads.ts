import { atom } from 'recoil'
import { RPCResult } from '../types'

export const activeDownloadsState = atom<RPCResult[] | undefined>({
  key: 'activeDownloadsState',
  default: undefined
})