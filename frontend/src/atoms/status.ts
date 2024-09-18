import { pipe } from 'fp-ts/lib/function'
import { of } from 'fp-ts/lib/Task'
import { getOrElse } from 'fp-ts/lib/TaskEither'
import { atom, selector } from 'recoil'
import { ffetch } from '../lib/httpClient'
import { RPCVersion } from '../types'
import { rpcClientState } from './rpc'
import { serverURL } from './settings'

export const connectedState = atom({
  key: 'connectedState',
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

export const ytdlpRpcVersionState = selector<RPCVersion>({
  key: 'ytdlpRpcVersionState',
  get: async ({ get }) => await pipe(
    ffetch<RPCVersion>(`${get(serverURL)}/api/v1/version`),
    getOrElse(() => pipe(
      {
        rpcVersion: 'unknown version',
        ytdlpVersion: 'unknown version',
      },
      of
    )),
  )()
})