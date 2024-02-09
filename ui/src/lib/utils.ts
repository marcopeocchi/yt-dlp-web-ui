import { pipe } from 'fp-ts/lib/function'
import type { RPCResponse } from "./types"

/**
 * Validate an ip v4 via regex
 * @param {string} ipAddr 
 * @returns ip validity test
 */
export function validateIP(ipAddr: string): boolean {
  let ipRegex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm
  return ipRegex.test(ipAddr)
}

export function validateDomain(url: string): boolean {
  const urlRegex = /(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  const [name, slug] = url.split('/')

  return urlRegex.test(url) || name === 'localhost' && slugRegex.test(slug)
}

export function isValidURL(url: string): boolean {
  let urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/
  return urlRegex.test(url)
}

export function ellipsis(str: string, lim: number): string {
  if (str) {
    return str.length > lim ? `${str.substring(0, lim)}...` : str
  }
  return ''
}

export function toFormatArgs(codes: string[]): string {
  if (codes.length > 1) {
    return codes.reduce((v, a) => ` -f ${v}+${a}`)
  }
  if (codes.length === 1) {
    return ` -f ${codes[0]}`
  }
  return ''
}

export const formatGiB = (bytes: number) =>
  `${(bytes / 1_000_000_000).toFixed(0)}GiB`

export const roundMiB = (bytes: number) =>
  `${(bytes / 1_000_000).toFixed(2)} MiB`

export const formatSpeedMiB = (val: number) =>
  `${roundMiB(val)}/s`

export const datetimeCompareFunc = (a: string, b: string) =>
  new Date(a).getTime() - new Date(b).getTime()

export function isRPCResponse(object: any): object is RPCResponse<any> {
  return 'result' in object && 'id' in object
}

export function mapProcessStatus(status: number) {
  switch (status) {
    case 0:
      return 'Pending'
    case 1:
      return 'Downloading'
    case 2:
      return 'Completed'
    case 3:
      return 'Error'
    default:
      return 'Pending'
  }
}

export const prefersDarkMode = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

export const base64URLEncode = (s: string) => pipe(
  s,
  s => String.fromCodePoint(...new TextEncoder().encode(s)),
  btoa,
  encodeURIComponent
)

export const debounce = (callback: Function, wait = 300) => {
  let timeout: ReturnType<typeof setTimeout>

  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => callback(...args), wait)
  }
}