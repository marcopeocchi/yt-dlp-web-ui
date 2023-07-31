import { selector } from 'recoil'
import I18nBuilder from '../lib/intl'
import { languageState } from './settings'

export const i18nBuilderState = selector({
  key: 'i18nBuilderState',
  get: ({ get }) => new I18nBuilder(get(languageState)),
  dangerouslyAllowMutability: true,
})
