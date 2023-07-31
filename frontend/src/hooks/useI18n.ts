import { useRecoilValue } from 'recoil'
import { i18nBuilderState } from '../atoms/i18n'

export const useI18n = () => {
  const instance = useRecoilValue(i18nBuilderState)

  return {
    i18n: instance
  }
}