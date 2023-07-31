import { atom } from 'recoil'
import { DLMetadata } from '../types'

export const selectedFormatState = atom<Partial<DLMetadata>>({
  key: 'selectedFormatState',
  default: {},
})