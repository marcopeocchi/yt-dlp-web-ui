// @ts-nocheck
import i18n from "../../assets/i18n.yaml";

export default class I18nBuilder {
    private language: string;
    private textMap = i18n.languages;

    constructor(language: string) {
        this.language = language;
    }

    getLanguage(): string {
        return this.language;
    }

    setLanguage(language: string): void {
        this.language = language;
    }

    t(key: string): string {
        const map = this.textMap[this.language]
        if (map) {
            const translation = map[key];
            return translation ?? 'caption not defined';
        }
        return 'caption not defined';
    }
}