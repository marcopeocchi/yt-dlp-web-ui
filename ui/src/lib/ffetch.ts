import { tryCatch } from 'fp-ts/TaskEither'

export const ffetch = <T>(url: string, opt?: RequestInit) => tryCatch(
  () => fetcher<T>(url, opt),
  (e) => `error while fetching: ${e}`
)


const fetcher = async <T>(url: string, opt?: RequestInit) => {
  const jwt = localStorage.getItem('token')

  if (opt && !opt.headers) {
    opt.headers = {
      'Content-Type': 'application/json',
    }
  }

  const res = await fetch(url, {
    ...opt,
    headers: {
      ...opt?.headers,
      'X-Authentication': jwt ?? ''
    }
  })

  if (!res.ok) {
    throw await res.text()
  }
  return res.json() as T
}