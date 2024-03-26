import { atom } from 'recoil'
import { RPCResult } from '../types'

export const loadingAtom = atom({
  key: 'loadingAtom',
  default: true
})

export const optimisticDownloadsState = atom<RPCResult[]>({
  key: 'optimisticDownloadsState',
  default: []
})

export const totalDownloadSpeedState = atom<number>({
  key: 'totalDownloadSpeedState',
  default: 0
})