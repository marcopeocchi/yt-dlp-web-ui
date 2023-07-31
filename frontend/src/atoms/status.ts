import { atom, selector } from 'recoil'

type StatusState = {
  connected: boolean,
  updated: boolean,
  downloading: boolean,
  freeSpace: number,
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

export const freeSpaceBytesState = atom({
  key: 'freeSpaceBytesState',
  default: 0
})

export const statusState = selector<StatusState>({
  key: 'statusState',
  get: ({ get }) => ({
    connected: get(connectedState),
    updated: get(updatedBinaryState),
    downloading: get(isDownloadingState),
    freeSpace: get(freeSpaceBytesState),
  })
})