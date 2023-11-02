// @ts-nocheck
import i18n from "../assets/i18n.yaml"

export default class I18nBuilder {
  private language: string
  private textMap = i18n.languages
  private current: string[]

  constructor(language: string) {
    this.setLanguage(language)
  }

  getLanguage(): string {
    return this.language
  }

  setLanguage(language: string): void {
    this.language = language
    this.current = this.textMap[this.language]
  }

  t(key: string): string {
    if (this.current) {
      return this.current[key] ?? 'caption not defined'
    }
    return 'caption not defined'
  }
}
