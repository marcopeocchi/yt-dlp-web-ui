import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

type FetchInit = {
  url: string,
  opt?: RequestInit
}

export async function ffetch<T>(
  url: string,
  onSuccess: (res: T) => void,
  onError: (err: string) => void,
  opt?: RequestInit,
) {
  const res = await fetch(url, opt)
  if (!res.ok) {
    onError(await res.text())
    return
  }
  onSuccess(await res.json() as T)
}