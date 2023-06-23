import { createContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import I18nBuilder from '../lib/intl'
import { RootState, store } from '../stores/store'

type Props = {
  children: React.ReactNode
}

interface Context {
  i18n: I18nBuilder
}

export const I18nContext = createContext<Context>({
  i18n: new I18nBuilder(store.getState().settings.language)
})

export default function I18nProvider({ children }: Props) {
  const settings = useSelector((state: RootState) => state.settings)

  const i18n = useMemo(() => new I18nBuilder(
    settings.language
  ), [settings.language])

  return (
    <I18nContext.Provider value={{ i18n }}>
      {children}
    </I18nContext.Provider>
  )
}