import { tryCatch } from 'fp-ts/TaskEither'
import { flow } from 'fp-ts/lib/function'

export const ffetch = <T>(url: string, opt?: RequestInit) => flow(
  tryCatch(
    () => fetcher<T>(url, opt),
    (e) => `error while fetching: ${e}`
  )
)

const fetcher = async <T>(url: string, opt?: RequestInit) => {
  const res = await fetch(url, opt)

  if (opt && !opt.headers) {
    opt.headers = {
      'Content-Type': 'application/json',
    }
  }

  if (!res.ok) {
    throw await res.text()
  }
  return res.json() as T
}