import { getOrElse } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import { atom, selector } from 'recoil'
import { ffetch } from '../lib/httpClient'
import { CustomTemplate } from '../types'
import { serverSideCookiesState, serverURL } from './settings'

export const cookiesTemplateState = selector({
  key: 'cookiesTemplateState',
  get: ({ get }) => get(serverSideCookiesState)
    ? '--cookies=cookies.txt'
    : ''
})

export const customArgsState = atom({
  key: 'customArgsState',
  default: localStorage.getItem('customArgs') ?? '',
  effects: [
    ({ onSet }) => onSet(e => localStorage.setItem('customArgs', e))
  ]
})

export const filenameTemplateState = atom({
  key: 'filenameTemplateState',
  default: localStorage.getItem('lastFilenameTemplate') ?? '',
  effects: [
    ({ onSet }) => onSet(e => localStorage.setItem('lastFilenameTemplate', e))
  ]
})

export const downloadTemplateState = selector({
  key: 'downloadTemplateState',
  get: ({ get }) =>
    `${get(customArgsState)} ${get(cookiesTemplateState)}`
      .replace(/  +/g, ' ')
      .trim()
})

export const savedTemplatesState = selector<CustomTemplate[]>({
  key: 'savedTemplatesState',
  get: async ({ get }) => {
    const task = ffetch<CustomTemplate[]>(`${get(serverURL)}/api/v1/template/all`)
    const either = await task()

    return pipe(
      either,
      getOrElse(() => new Array<CustomTemplate>())
    )
  }
})