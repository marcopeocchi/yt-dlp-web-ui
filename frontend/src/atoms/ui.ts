import { atom, selector } from 'recoil'
import { activeDownloadsState } from './downloads'

export const loadingAtom = atom({
  key: 'loadingAtom',
  default: true
})

export const totalDownloadSpeedState = selector<number>({
  key: 'totalDownloadSpeedState',
  get: ({ get }) => get(activeDownloadsState)
    .map(d => d.progress.speed)
    .reduce((curr, next) => curr + next, 0)
})