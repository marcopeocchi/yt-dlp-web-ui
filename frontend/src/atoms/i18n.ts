import { atom } from 'jotai'
import I18nBuilder from '../lib/intl'
import { languageState } from './settings'

export const i18nBuilderState = atom((get) => new I18nBuilder(get(languageState)))
