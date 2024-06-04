import { atom, selector } from 'recoil'
import { prefersDarkMode } from '../utils'

export const languages = [
  'english',
  'chinese',
  'russian',
  'italian',
  'spanish',
  'korean',
  'japanese',
  'catalan',
  'ukrainian',
  'polish',
  'german'
] as const

export type Language = (typeof languages)[number]

export type Theme = 'light' | 'dark' | 'system'
export type ThemeNarrowed = 'light' | 'dark'

export interface SettingsState {
  serverAddr: string
  serverPort: number
  language: Language
  theme: ThemeNarrowed
  cliArgs: string
  formatSelection: boolean
  fileRenaming: boolean
  pathOverriding: boolean
  enableCustomArgs: boolean
  listView: boolean
  servedFromReverseProxy: boolean
  appTitle: string
}

export const languageState = atom<Language>({
  key: 'languageState',
  default: localStorage.getItem('language') as Language || 'english',
  effects: [
    ({ onSet }) =>
      onSet(l => localStorage.setItem('language', l.toString()))
  ]
})

export const themeState = atom<Theme>({
  key: 'themeStateState',
  default: localStorage.getItem('theme') as Theme || 'system',
  effects: [
    ({ onSet }) =>
      onSet(l => localStorage.setItem('theme', l.toString()))
  ]
})

export const serverAddressState = atom<string>({
  key: 'serverAddressState',
  default: localStorage.getItem('server-addr') || window.location.hostname,
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('server-addr', a.toString()))
  ]
})

export const serverPortState = atom<number>({
  key: 'serverPortState',
  default: Number(localStorage.getItem('server-port')) ||
    Number(window.location.port),
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('server-port', a.toString()))
  ]
})

export const latestCliArgumentsState = atom<string>({
  key: 'latestCliArgumentsState',
  default: localStorage.getItem('cli-args') || '--no-mtime',
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('cli-args', a.toString()))
  ]
})

export const formatSelectionState = atom({
  key: 'formatSelectionState',
  default: localStorage.getItem('format-selection') === "true",
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('format-selection', a.toString()))
  ]
})

export const fileRenamingState = atom({
  key: 'fileRenamingState',
  default: localStorage.getItem('file-renaming') === "true",
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('file-renaming', a.toString()))
  ]
})

export const pathOverridingState = atom({
  key: 'pathOverridingState',
  default: localStorage.getItem('path-overriding') === "true",
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('path-overriding', a.toString()))
  ]
})

export const enableCustomArgsState = atom({
  key: 'enableCustomArgsState',
  default: localStorage.getItem('enable-custom-args') === "true",
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('enable-custom-args', a.toString()))
  ]
})

export const listViewState = atom({
  key: 'listViewState',
  default: localStorage.getItem('listview') === "true",
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('listview', a.toString()))
  ]
})

export const servedFromReverseProxyState = atom({
  key: 'servedFromReverseProxyState',
  default: localStorage.getItem('reverseProxy') === "true" || window.location.port == "",
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('reverseProxy', a.toString()))
  ]
})

export const servedFromReverseProxySubDirState = atom<string>({
  key: 'servedFromReverseProxyState',
  default: localStorage.getItem('reverseProxySubDir') ?? '',
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('reverseProxySubDir', a.toString()))
  ]
})

export const appTitleState = atom({
  key: 'appTitleState',
  default: localStorage.getItem('appTitle') ?? 'yt-dlp Web UI',
  effects: [
    ({ onSet }) =>
      onSet(a => localStorage.setItem('appTitle', a.toString()))
  ]
})

export const serverAddressAndPortState = selector({
  key: 'serverAddressAndPortState',
  get: ({ get }) => {
    if (get(servedFromReverseProxySubDirState)) {
      return `${get(serverAddressState)}/${get(servedFromReverseProxySubDirState)}/`
    }
    if (get(servedFromReverseProxyState)) {
      return `${get(serverAddressState)}`
    }
    return `${get(serverAddressState)}:${get(serverPortState)}`
  }
})

export const serverURL = selector({
  key: 'serverURL',
  get: ({ get }) =>
    `${window.location.protocol}//${get(serverAddressAndPortState)}`
})

export const rpcWebSocketEndpoint = selector({
  key: 'rpcWebSocketEndpoint',
  get: ({ get }) => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${get(serverAddressAndPortState)}/rpc/ws`
  }
})

export const rpcHTTPEndpoint = selector({
  key: 'rpcHTTPEndpoint',
  get: ({ get }) => {
    const proto = window.location.protocol
    return `${proto}//${get(serverAddressAndPortState)}/rpc/http`
  }
})

export const cookiesState = atom({
  key: 'cookiesState',
  default: localStorage.getItem('yt-dlp-cookies') ?? '',
  effects: [
    ({ onSet }) =>
      onSet(c => localStorage.setItem('yt-dlp-cookies', c))
  ]
})

export const themeSelector = selector<ThemeNarrowed>({
  key: 'themeSelector',
  get: ({ get }) => {
    const theme = get(themeState)
    if ((theme === 'system' && prefersDarkMode()) || theme === 'dark') {
      return 'dark'
    }
    return 'light'
  }
})

export const settingsState = selector<SettingsState>({
  key: 'settingsState',
  get: ({ get }) => ({
    serverAddr: get(serverAddressState),
    serverPort: get(serverPortState),
    language: get(languageState),
    theme: get(themeSelector),
    cliArgs: get(latestCliArgumentsState),
    formatSelection: get(formatSelectionState),
    fileRenaming: get(fileRenamingState),
    pathOverriding: get(pathOverridingState),
    enableCustomArgs: get(enableCustomArgsState),
    listView: get(listViewState),
    servedFromReverseProxy: get(servedFromReverseProxyState),
    appTitle: get(appTitleState)
  })
})