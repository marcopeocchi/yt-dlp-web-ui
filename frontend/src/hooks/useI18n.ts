import { useAtomValue } from 'jotai'
import { i18nBuilderState } from '../atoms/i18n'

export const useI18n = () => {
  const instance = useAtomValue(i18nBuilderState)

  return {
    i18n: instance,
    t: instance.t
  }
}