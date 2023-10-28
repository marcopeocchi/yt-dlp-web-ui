import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { atom, selector } from 'recoil'
import { RPCResult } from '../types'

export const downloadsState = atom<O.Option<RPCResult[]>>({
  key: 'downloadsState',
  default: O.none
})

export const loadingDownloadsState = selector<boolean>({
  key: 'loadingDownloadsState',
  get: ({ get }) => O.isNone(get(downloadsState))
})

export const activeDownloadsState = selector<RPCResult[]>({
  key: 'activeDownloadsState',
  get: ({ get }) => pipe(
    get(downloadsState),
    O.getOrElse(() => new Array<RPCResult>())
  )
})