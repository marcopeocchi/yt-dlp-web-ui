import { atom, selector } from 'recoil'
import { rpcClientState } from './rpc'

type StatusState = {
  connected: boolean,
  updated: boolean,
  downloading: boolean,
}


export const connectedState = atom({
  key: 'connectedState',
  default: false
})

export const updatedBinaryState = atom({
  key: 'updatedBinaryState',
  default: false
})

export const isDownloadingState = atom({
  key: 'isDownloadingState',
  default: false
})

export const freeSpaceBytesState = selector({
  key: 'freeSpaceBytesState',
  get: async ({ get }) => {
    const res = await get(rpcClientState).freeSpace()
      .catch(() => ({ result: 0 }))
    return res.result
  }
})

export const availableDownloadPathsState = selector({
  key: 'availableDownloadPathsState',
  get: async ({ get }) => {
    const res = await get(rpcClientState).directoryTree()
      .catch(() => ({ result: [] }))
    return res.result
  }
})