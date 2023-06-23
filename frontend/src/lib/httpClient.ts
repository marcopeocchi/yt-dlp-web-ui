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